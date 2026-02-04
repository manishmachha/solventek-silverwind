package com.solventek.silverwind.org;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.auth.EmployeeRepository;
import com.solventek.silverwind.security.UserPrincipal;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.solventek.silverwind.notifications.NotificationService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final NotificationService notificationService;
    private final com.solventek.silverwind.timeline.TimelineService timelineService;

    // ============ EMPLOYEE SELF-SERVICE ============

    public Attendance checkIn(UUID userId) {
        log.info("Attempting check-in for user: {}", userId);
        try {
            Employee employee = employeeRepository.findById(userId)
                    .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

            // Ensure user is acting for themselves (or we trust the controller passed the
            // right ID from principal)
            // ideally controller passes principal's ID.

            LocalDate today = LocalDate.now();
            if (attendanceRepository.findByEmployee_IdAndDate(userId, today).isPresent()) {
                log.warn("Check-in failed: User {} already checked in for today", userId);
                throw new IllegalArgumentException("Already checked in for today");
            }

            Attendance attendance = Attendance.builder()
                    .employee(employee)
                    .organization(employee.getOrganization())
                    .date(today)
                    .checkInTime(LocalTime.now())
                    .status(AttendanceStatus.PRESENT)
                    .build();

            Attendance saved = attendanceRepository.save(attendance);
            log.info("User {} checked in successfully at {}", userId, saved.getCheckInTime());

            timelineService.createEvent(employee.getOrganization().getId(), "ATTENDANCE", saved.getId(), "CHECK_IN",
                    "Attendance Check-In", userId, userId, "User Checked In", null);

            return saved;
        } catch (Exception e) {
            log.error("Error checking in user {}: {}", userId, e.getMessage(), e);
            throw e;
        }
    }

    public Attendance checkOut(UUID userId) {
        log.info("Attempting check-out for user: {}", userId);
        try {
            LocalDate today = LocalDate.now();
            Attendance attendance = attendanceRepository.findByEmployee_IdAndDate(userId, today)
                    .orElseThrow(() -> new IllegalArgumentException("No check-in record found for today"));

            if (attendance.getCheckOutTime() != null) {
                log.warn("Check-out failed: User {} already checked out today", userId);
                throw new IllegalArgumentException("Already checked out today");
            }

            attendance.setCheckOutTime(LocalTime.now());
            Attendance saved = attendanceRepository.save(attendance);
            log.info("User {} checked out successfully at {}", userId, saved.getCheckOutTime());

            timelineService.createEvent(attendance.getOrganization().getId(), "ATTENDANCE", saved.getId(), "CHECK_OUT",
                    "Attendance Check-Out", userId, userId, "User Checked Out", null);

            return saved;
        } catch (Exception e) {
            log.error("Error checking out user {}: {}", userId, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public List<Attendance> getMyAttendance() {
        UUID userId = getCurrentUserId();
        log.debug("Fetching attendance for Current User ID: {}", userId);
        return attendanceRepository.findByEmployee_Id(userId);
    }

    @Transactional(readOnly = true)
    public List<Attendance> getMyAttendanceByRange(LocalDate startDate, LocalDate endDate) {
        UUID userId = getCurrentUserId();
        log.debug("Fetching attendance for Current User ID: {} between {} and {}", userId, startDate, endDate);
        return attendanceRepository.findByEmployee_IdAndDateBetween(userId, startDate, endDate);
    }

    @Transactional(readOnly = true)
    public TimesheetSummary getMyTimesheet(LocalDate startDate, LocalDate endDate) {
        UUID userId = getCurrentUserId();
        log.debug("Generating timesheet for Current User ID: {} between {} and {}", userId, startDate, endDate);
        return generateTimesheet(userId, startDate, endDate);
    }

    // ============ ADMIN ACTIONS ============

    public Attendance adminMarkAttendance(UUID userId, LocalDate date, AttendanceStatus status, String notes) {
        log.info("Admin marking attendance for User: {}, Date: {}, Status: {}", userId, date, status);
        try {
            Employee employee = employeeRepository.findById(userId)
                    .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

            ensureSameOrg(employee.getOrganization().getId());

            Attendance attendance = attendanceRepository.findByEmployee_IdAndDate(userId, date)
                    .orElse(Attendance.builder()
                            .employee(employee)
                            .organization(employee.getOrganization())
                            .date(date)
                            .build());

            attendance.setStatus(status);
            attendance.setNotes(notes);

            if (status == AttendanceStatus.ABSENT || status == AttendanceStatus.ON_LEAVE
                    || status == AttendanceStatus.WEEKEND) {
                attendance.setCheckInTime(null);
                attendance.setCheckOutTime(null);
            }
            // If PRESENT/HALF_DAY, we keep existing times unless manually updated (which
            // would need more params, but for now strict status update)
            // Ideally admin might want to set times too, but we'll stick to the requirement
            // "implement the same" as solventek.
            // Solventek implementation:
            // if (status == AttendanceStatus.ABSENT || status == AttendanceStatus.ON_LEAVE)
            // { checkIn=null; checkOut=null; }

            Attendance saved = attendanceRepository.save(attendance);
            log.info("Admin successfully marked attendance for user {} on {}: {}", userId, date, status);

            // Notify User
            notificationService.sendNotification(userId, "Attendance Update",
                    "Your attendance for " + date + " has been updated to " + status + " by administrator.",
                    "ATTENDANCE", saved.getId());

            timelineService.createEvent(employee.getOrganization().getId(), "ATTENDANCE", saved.getId(), "ADMIN_UPDATE",
                    "Attendance Updated by Admin", getCurrentUserId(), userId,
                    "Attendance updated to " + status + " for " + date, null);

            return saved;
        } catch (Exception e) {
            log.error("Error marking attendance for user {} on {}: {}", userId, date, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public List<Attendance> getAttendanceByEmployee(UUID userId) {
        log.debug("Fetching attendance for User ID: {}", userId);
        Employee employee = employeeRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        ensureSameOrg(employee.getOrganization().getId());
        return attendanceRepository.findByEmployee_Id(userId);
    }

    @Transactional(readOnly = true)
    public List<Attendance> getAttendanceByEmployeeAndRange(UUID userId, LocalDate startDate, LocalDate endDate) {
        log.debug("Fetching attendance for User ID: {} between {} and {}", userId, startDate, endDate);
        Employee employee = employeeRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        ensureSameOrg(employee.getOrganization().getId());
        return attendanceRepository.findByEmployee_IdAndDateBetween(userId, startDate, endDate);
    }

    @Transactional(readOnly = true)
    public List<Attendance> getAttendanceByDate(LocalDate date) {
        UUID orgId = getCurrentUserOrgId();
        log.debug("Fetching attendance for Org ID: {} on Date: {}", orgId, date);
        return attendanceRepository.findByOrganization_IdAndDate(orgId, date);
    }

    @Transactional(readOnly = true)
    public List<Attendance> getAttendanceByRange(LocalDate startDate, LocalDate endDate) {
        UUID orgId = getCurrentUserOrgId();
        log.debug("Fetching attendance for Org ID: {} between {} and {}", orgId, startDate, endDate);
        return attendanceRepository.findByOrganization_IdAndDateBetween(orgId, startDate, endDate);
    }

    // ============ TIMESHEET GENERATION ============

    @Transactional(readOnly = true)
    public TimesheetSummary generateTimesheet(UUID userId, LocalDate startDate, LocalDate endDate) {
        log.debug("Internal generateTimesheet call for User ID: {} between {} and {}", userId, startDate, endDate);
        Employee employee = employeeRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        // Security check
        if (!employee.getId().equals(getCurrentUserId())) {
            ensureSameOrg(employee.getOrganization().getId()); // Admins can view others in same org
            // Note: Regular employees shouldn't call this for others, Controller will
            // handle RBAC
        }

        List<Attendance> attendances = attendanceRepository.findByEmployee_IdAndDateBetween(userId, startDate, endDate);

        double totalHours = 0;
        int daysPresent = 0;

        List<TimesheetEntry> entries = attendances.stream().map(a -> {
            double hours = 0;
            if (a.getCheckInTime() != null && a.getCheckOutTime() != null) {
                hours = Duration.between(a.getCheckInTime(), a.getCheckOutTime()).toMinutes() / 60.0;
            }

            return TimesheetEntry.builder()
                    .date(a.getDate())
                    .checkInTime(a.getCheckInTime())
                    .checkOutTime(a.getCheckOutTime())
                    .status(a.getStatus())
                    .hoursWorked(hours)
                    .notes(a.getNotes())
                    .build();
        }).collect(Collectors.toList());

        for (TimesheetEntry e : entries) {
            totalHours += e.getHoursWorked();
            if (e.getStatus() == AttendanceStatus.PRESENT || e.getStatus() == AttendanceStatus.HALF_DAY) {
                daysPresent++;
            }
        }

        return TimesheetSummary.builder()
                .userId(employee.getId())
                .userName(employee.getFullName())
                .startDate(startDate)
                .endDate(endDate)
                .totalHours(Math.round(totalHours * 100.0) / 100.0)
                .daysPresent(daysPresent)
                .entries(entries)
                .build();
    }

    // ============ HELPER METHODS ============

    private UUID getCurrentUserOrgId() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return principal.getOrgId();
    }

    private UUID getCurrentUserId() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return principal.getId();
    }

    // ============ PDF GENERATION ============

    @Transactional(readOnly = true)
    public byte[] generateTimesheetPdf(UUID userId, LocalDate startDate, LocalDate endDate) {
        log.info("Generating timesheet PDF for User ID: {} between {} and {}", userId, startDate, endDate);
        TimesheetSummary summary = generateTimesheet(userId, startDate, endDate);
        Employee employee = employeeRepository.findById(userId).orElseThrow();
        com.solventek.silverwind.org.Organization org = employee.getOrganization();

        try (java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
            com.lowagie.text.Document document = new com.lowagie.text.Document();
            com.lowagie.text.pdf.PdfWriter.getInstance(document, out);
            document.open();

            // Font & Color setup (same as Payslip)
            java.awt.Color themeColor = new java.awt.Color(41, 128, 185);
            com.lowagie.text.Font titleFont = com.lowagie.text.FontFactory
                    .getFont(com.lowagie.text.FontFactory.HELVETICA_BOLD, 18, themeColor);
            com.lowagie.text.Font headerFont = com.lowagie.text.FontFactory
                    .getFont(com.lowagie.text.FontFactory.HELVETICA_BOLD, 10);
            com.lowagie.text.Font normalFont = com.lowagie.text.FontFactory
                    .getFont(com.lowagie.text.FontFactory.HELVETICA, 10);
            com.lowagie.text.Font whiteFont = com.lowagie.text.FontFactory
                    .getFont(com.lowagie.text.FontFactory.HELVETICA_BOLD, 12, java.awt.Color.WHITE);

            // 1. Header with Logo & Org Info
            com.lowagie.text.pdf.PdfPTable headerTable = new com.lowagie.text.pdf.PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[] { 1, 3 });

            // Logo
            try {
                String logoUrl = org.getLogoUrl();
                if (logoUrl != null && !logoUrl.isEmpty()) {
                    com.lowagie.text.Image logo = com.lowagie.text.Image.getInstance(new java.net.URI(logoUrl).toURL());
                    logo.scaleToFit(80, 80);
                    com.lowagie.text.pdf.PdfPCell logoCell = new com.lowagie.text.pdf.PdfPCell(logo);
                    logoCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
                    headerTable.addCell(logoCell);
                } else {
                    com.lowagie.text.pdf.PdfPCell cell = new com.lowagie.text.pdf.PdfPCell(
                            new com.lowagie.text.Phrase(""));
                    cell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
                    headerTable.addCell(cell);
                }
            } catch (Exception e) {
                com.lowagie.text.pdf.PdfPCell cell = new com.lowagie.text.pdf.PdfPCell(new com.lowagie.text.Phrase(""));
                cell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
                headerTable.addCell(cell);
            }

            // Organization Info
            com.lowagie.text.pdf.PdfPCell companyCell = new com.lowagie.text.pdf.PdfPCell();
            companyCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            companyCell.addElement(new com.lowagie.text.Paragraph(org.getName().toUpperCase(), titleFont));
            companyCell.addElement(new com.lowagie.text.Paragraph("TIMESHEET REPORT", headerFont));
            companyCell.addElement(new com.lowagie.text.Paragraph(startDate + " to " + endDate, normalFont));
            headerTable.addCell(companyCell);
            document.add(headerTable);
            document.add(new com.lowagie.text.Paragraph(" "));

            // 2. Employee Summary
            com.lowagie.text.pdf.PdfPTable summaryTable = new com.lowagie.text.pdf.PdfPTable(4);
            summaryTable.setWidthPercentage(100);
            summaryTable.setWidths(new float[] { 2, 3, 2, 3 });

            addDetailCell(summaryTable, "Employee:", headerFont);
            addDetailCell(summaryTable, summary.getUserName(), normalFont);
            addDetailCell(summaryTable, "Total Hours:", headerFont);
            addDetailCell(summaryTable, String.valueOf(summary.getTotalHours()), normalFont);

            addDetailCell(summaryTable, "Department:", headerFont);
            addDetailCell(summaryTable, employee.getDepartment() != null ? employee.getDepartment() : "-", normalFont);
            addDetailCell(summaryTable, "Days Present:", headerFont);
            addDetailCell(summaryTable, String.valueOf(summary.getDaysPresent()), normalFont);

            document.add(summaryTable);
            document.add(new com.lowagie.text.Paragraph(" "));

            // 3. Daily Entries
            com.lowagie.text.pdf.PdfPTable table = new com.lowagie.text.pdf.PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[] { 2, 2, 2, 2, 2, 4 });

            addHeaderCell(table, "Date", whiteFont, themeColor);
            addHeaderCell(table, "Check In", whiteFont, themeColor);
            addHeaderCell(table, "Check Out", whiteFont, themeColor);
            addHeaderCell(table, "Status", whiteFont, themeColor);
            addHeaderCell(table, "Hours", whiteFont, themeColor);
            addHeaderCell(table, "Notes", whiteFont, themeColor);

            for (TimesheetEntry entry : summary.getEntries()) {
                addCell(table, entry.getDate().toString(), normalFont);
                addCell(table, entry.getCheckInTime() != null ? entry.getCheckInTime().toString().substring(0, 5) : "-",
                        normalFont);
                addCell(table,
                        entry.getCheckOutTime() != null ? entry.getCheckOutTime().toString().substring(0, 5) : "-",
                        normalFont);
                addCell(table, entry.getStatus().name(), normalFont);
                addCell(table, String.format("%.2f", entry.getHoursWorked()), normalFont);
                addCell(table, entry.getNotes() != null ? entry.getNotes() : "", normalFont);
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating timesheet PDF", e);
        }
    }

    private void addDetailCell(com.lowagie.text.pdf.PdfPTable table, String text, com.lowagie.text.Font font) {
        com.lowagie.text.pdf.PdfPCell cell = new com.lowagie.text.pdf.PdfPCell(new com.lowagie.text.Phrase(text, font));
        cell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
        cell.setPadding(4);
        table.addCell(cell);
    }

    private void addHeaderCell(com.lowagie.text.pdf.PdfPTable table, String text, com.lowagie.text.Font font,
            java.awt.Color color) {
        com.lowagie.text.pdf.PdfPCell cell = new com.lowagie.text.pdf.PdfPCell(new com.lowagie.text.Phrase(text, font));
        cell.setBackgroundColor(color);
        cell.setPadding(6);
        cell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    private void addCell(com.lowagie.text.pdf.PdfPTable table, String text, com.lowagie.text.Font font) {
        com.lowagie.text.pdf.PdfPCell cell = new com.lowagie.text.pdf.PdfPCell(new com.lowagie.text.Phrase(text, font));
        cell.setPadding(5);
        table.addCell(cell);
    }

    private void ensureSameOrg(UUID targetOrgId) {
        UUID myOrgId = getCurrentUserOrgId();
        if (!myOrgId.equals(targetOrgId)) {
            throw new AccessDeniedException("Access denied: different organization");
        }
    }
}
