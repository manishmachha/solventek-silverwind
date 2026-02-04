package com.solventek.silverwind.org;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.auth.EmployeeRepository;
import com.solventek.silverwind.security.UserPrincipal;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import com.solventek.silverwind.notifications.NotificationService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PayrollService {

    private final PayrollRepository payrollRepository;
    private final SalaryStructureRepository salaryStructureRepository;
    private final SalaryRevisionRepository salaryRevisionRepository;
    private final EmployeeRepository employeeRepository;
    private final OrganizationRepository organizationRepository;
    private final NotificationService notificationService;
    private final com.solventek.silverwind.timeline.TimelineService timelineService;

    // ============ SALARY STRUCTURE ============

    @Transactional(readOnly = true)
    public SalaryStructure getSalaryStructure(UUID userId) {
        log.debug("Fetching salary structure for User ID: {}", userId);
        return salaryStructureRepository.findByEmployee_Id(userId)
                .orElseThrow(() -> new EntityNotFoundException("Salary structure not found for user"));
    }

    @Transactional(readOnly = true)
    public SalaryStructure getMySalaryStructure() {
        UUID currentUserId = getCurrentUserId();
        log.debug("Fetching salary structure for Current User ID: {}", currentUserId);
        return getSalaryStructure(currentUserId);
    }

    @Transactional(readOnly = true)
    public List<SalaryStructure> listAllSalaryStructures() {
        UUID orgId = getCurrentUserOrgId();
        log.debug("Listing all salary structures for Org ID: {}", orgId);
        return salaryStructureRepository.findByOrganization_Id(orgId);
    }

    public SalaryStructure saveSalaryStructure(UUID userId, BigDecimal basic, BigDecimal da, BigDecimal hra,
            BigDecimal medicalAllowance, BigDecimal specialAllowance,
            BigDecimal lta, BigDecimal communicationAllowance,
            BigDecimal otherEarnings, BigDecimal epfDeduction) {
        log.info("Saving salary structure for user: {}", userId);
        try {
            Employee employee = employeeRepository.findById(userId)
                    .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

            ensureSameOrg(employee.getOrganization().getId());

            SalaryStructure existing = salaryStructureRepository.findByEmployee_Id(userId).orElse(null);

            if (existing == null) {
                // First time creation
                existing = SalaryStructure.builder()
                        .employee(employee)
                        .organization(employee.getOrganization())
                        .basic(basic)
                        .da(da)
                        .hra(hra)
                        .medicalAllowance(medicalAllowance)
                        .specialAllowance(specialAllowance)
                        .lta(lta)
                        .communicationAllowance(communicationAllowance)
                        .otherEarnings(otherEarnings)
                        .epfDeduction(epfDeduction)
                        .build();
                log.info("Creating new salary structure for user {}", userId);
            } else {
                // Check for CTC change and record revision
                BigDecimal oldCtc = existing.calculateCtc();

                existing.setBasic(basic);
                existing.setDa(da);
                existing.setHra(hra);
                existing.setMedicalAllowance(medicalAllowance);
                existing.setSpecialAllowance(specialAllowance);
                existing.setLta(lta);
                existing.setCommunicationAllowance(communicationAllowance);
                existing.setOtherEarnings(otherEarnings);
                existing.setEpfDeduction(epfDeduction);

                BigDecimal newCtc = existing.calculateCtc();

                if (oldCtc.compareTo(newCtc) != 0) {
                    SalaryRevision revision = SalaryRevision.builder()
                            .employee(employee)
                            .revisionDate(LocalDate.now())
                            .oldCtc(oldCtc)
                            .newCtc(newCtc)
                            .changeReason("Salary Update")
                            .build();
                    salaryRevisionRepository.save(revision);
                    log.info("Created salary revision for user {}. Old CTC: {}, New CTC: {}", userId, oldCtc, newCtc);
                }
            }

            SalaryStructure saved = salaryStructureRepository.save(existing);
            log.info("Salary structure saved successfully for user {}", userId);

            timelineService.createEvent(employee.getOrganization().getId(), "SALARY", saved.getId(), "UPDATE_STRUCTURE",
                    "Salary Structure Updated", getCurrentUserId(), userId, "Salary structure updated", null);

            return saved;
        } catch (Exception e) {
            log.error("Error saving salary structure for user {}: {}", userId, e.getMessage(), e);
            throw e;
        }
    }

    // ============ SALARY REVISION ============

    @Transactional(readOnly = true)
    public List<SalaryRevision> getSalaryRevisions(UUID userId) {
        log.debug("Fetching salary revisions for User ID: {}", userId);
        return salaryRevisionRepository.findByEmployee_IdOrderByRevisionDateDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<SalaryRevision> getMySalaryRevisions() {
        log.debug("Fetching salary revisions for Current User");
        return getSalaryRevisions(getCurrentUserId());
    }

    // ============ PAYROLL ============

    public Payroll generatePayroll(UUID userId, int month, int year) {
        log.info("Generating payroll for User: {}, Month: {}, Year: {}", userId, month, year);
        try {
            Employee employee = employeeRepository.findById(userId)
                    .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

            ensureSameOrg(employee.getOrganization().getId());

            if (payrollRepository.findByEmployee_IdAndMonthAndYear(userId, month, year).isPresent()) {
                log.warn("Payroll generation failed: Already exists for User {}, {}/{}", userId, month, year);
                throw new IllegalArgumentException("Payroll already generated for this period");
            }

            SalaryStructure structure = salaryStructureRepository.findByEmployee_Id(userId)
                    .orElseThrow(() -> new EntityNotFoundException("Salary structure not defined for user"));

            BigDecimal totalEarnings = structure.calculateCtc();
            BigDecimal totalDeductions = structure.getEpfDeduction();
            BigDecimal netPay = totalEarnings.subtract(totalDeductions);

            Payroll payroll = Payroll.builder()
                    .employee(employee)
                    .organization(employee.getOrganization())
                    .month(month)
                    .year(year)
                    .basic(structure.getBasic())
                    .da(structure.getDa())
                    .hra(structure.getHra())
                    .medicalAllowance(structure.getMedicalAllowance())
                    .specialAllowance(structure.getSpecialAllowance())
                    .lta(structure.getLta())
                    .communicationAllowance(structure.getCommunicationAllowance())
                    .otherEarnings(structure.getOtherEarnings())
                    .epfDeduction(structure.getEpfDeduction())
                    .totalEarnings(totalEarnings)
                    .totalDeductions(totalDeductions)
                    .netPay(netPay)
                    .status("PENDING")
                    .build();

            Payroll saved = payrollRepository.save(payroll);
            log.info("Generated payroll successfully for user {} for {}/{}", userId, month, year);

            // Notify User
            notificationService.sendNotification(userId, "Payslip Generated",
                    "Your payslip for " + getMonthName(month) + " " + year + " has been generated.", "PAYROLL",
                    saved.getId());

            timelineService.createEvent(employee.getOrganization().getId(), "PAYROLL", saved.getId(), "GENERATE",
                    "Payslip Generated", getCurrentUserId(), userId,
                    "Payslip generated for " + getMonthName(month) + " " + year, null);

            return saved;
        } catch (Exception e) {
            log.error("Error generating payroll for user {} period {}/{}: {}", userId, month, year, e.getMessage(), e);
            throw e;
        }
    }

    public Payroll markAsPaid(UUID payrollId) {
        log.info("Marking payroll {} as PAID", payrollId);
        try {
            Payroll payroll = payrollRepository.findById(payrollId)
                    .orElseThrow(() -> new EntityNotFoundException("Payroll not found: " + payrollId));

            ensureSameOrg(payroll.getOrganization().getId());

            payroll.setStatus("PAID");
            payroll.setPaymentDate(LocalDate.now());
            Payroll saved = payrollRepository.save(payroll);
            log.info("Payroll {} marked as PAID successfully", payrollId);

            // Notify User
            notificationService.sendNotification(payroll.getEmployee().getId(), "Payment Processed",
                    "Your salary payment for " + getMonthName(payroll.getMonth()) + " " + payroll.getYear()
                            + " has been processed.",
                    "PAYROLL", payroll.getId());

            timelineService.createEvent(payroll.getOrganization().getId(), "PAYROLL", payroll.getId(), "PAID",
                    "Salary Paid", getCurrentUserId(), payroll.getEmployee().getId(),
                    "Salary marked as PAID", null);

            return saved;
        } catch (Exception e) {
            log.error("Error marking payroll {} as paid: {}", payrollId, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public List<Payroll> getPayrollsByMonth(int month, int year) {
        UUID orgId = getCurrentUserOrgId();
        log.debug("Fetching payrolls for Org ID: {}, Month: {}, Year: {}", orgId, month, year);
        return payrollRepository.findByOrganization_IdAndMonthAndYear(orgId, month, year);
    }

    @Transactional(readOnly = true)
    public List<Payroll> getPayrollsByUser(UUID userId) {
        log.debug("Fetching payrolls for User ID: {}", userId);
        return payrollRepository.findByEmployee_Id(userId);
    }

    @Transactional(readOnly = true)
    public List<Payroll> getPayrollsByUserAndYear(UUID userId, int year) {
        log.debug("Fetching payrolls for User ID: {}, Year: {}", userId, year);
        return payrollRepository.findByEmployee_IdAndYear(userId, year);
    }

    @Transactional(readOnly = true)
    public List<Payroll> getMyPayslips() {
        UUID userId = getCurrentUserId();
        log.debug("Fetching payslips for Current User ID: {}", userId);
        return payrollRepository.findByEmployee_Id(userId);
    }

    @Transactional(readOnly = true)
    public List<Payroll> getMyPayslipsByYear(int year) {
        UUID userId = getCurrentUserId();
        log.debug("Fetching payslips for Current User ID: {}, Year: {}", userId, year);
        return payrollRepository.findByEmployee_IdAndYear(userId, year);
    }

    @Transactional(readOnly = true)
    public Payroll getPayrollById(UUID payrollId) {
        log.debug("Fetching Payroll ID: {}", payrollId);
        return payrollRepository.findById(payrollId)
                .orElseThrow(() -> new EntityNotFoundException("Payroll not found"));
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

    private void ensureSameOrg(UUID targetOrgId) {
        UUID myOrgId = getCurrentUserOrgId();
        if (!myOrgId.equals(targetOrgId)) {
            throw new AccessDeniedException("Access denied: different organization");
        }
    }

    // ============ PDF GENERATION ============

    @Transactional(readOnly = true)
    public byte[] generatePayslipPdf(UUID payrollId) {
        log.info("Generating Payslip PDF for Payroll ID: {}", payrollId);
        Payroll payroll = payrollRepository.findById(payrollId)
                .orElseThrow(() -> new EntityNotFoundException("Payroll not found"));

        Organization org = payroll.getOrganization();

        try (java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
            com.lowagie.text.Document document = new com.lowagie.text.Document();
            com.lowagie.text.pdf.PdfWriter.getInstance(document, out);
            document.open();

            // Colors
            java.awt.Color themeColor = new java.awt.Color(41, 128, 185);
            java.awt.Color headerBgColor = new java.awt.Color(236, 240, 241);

            // Fonts
            com.lowagie.text.Font titleFont = com.lowagie.text.FontFactory.getFont(
                    com.lowagie.text.FontFactory.HELVETICA_BOLD, 18, com.lowagie.text.Font.NORMAL, themeColor);
            com.lowagie.text.Font headerFont = com.lowagie.text.FontFactory.getFont(
                    com.lowagie.text.FontFactory.HELVETICA_BOLD, 10);
            com.lowagie.text.Font normalFont = com.lowagie.text.FontFactory.getFont(
                    com.lowagie.text.FontFactory.HELVETICA, 10);
            com.lowagie.text.Font whiteFont = com.lowagie.text.FontFactory.getFont(
                    com.lowagie.text.FontFactory.HELVETICA_BOLD, 12, com.lowagie.text.Font.NORMAL,
                    java.awt.Color.WHITE);
            com.lowagie.text.Font smallFont = com.lowagie.text.FontFactory.getFont(
                    com.lowagie.text.FontFactory.HELVETICA, 8, com.lowagie.text.Font.ITALIC, java.awt.Color.GRAY);

            // 1. Header with Logo and Company Name
            com.lowagie.text.pdf.PdfPTable headerTable = new com.lowagie.text.pdf.PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[] { 1, 3 });

            // Logo - use organization's logo if available
            try {
                String logoUrl = org.getLogoUrl();
                if (logoUrl != null && !logoUrl.isEmpty()) {
                    com.lowagie.text.Image logo = com.lowagie.text.Image.getInstance(new java.net.URI(logoUrl).toURL());
                    logo.scaleToFit(80, 80);
                    com.lowagie.text.pdf.PdfPCell logoCell = new com.lowagie.text.pdf.PdfPCell(logo);
                    logoCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
                    logoCell.setVerticalAlignment(com.lowagie.text.Element.ALIGN_MIDDLE);
                    headerTable.addCell(logoCell);
                } else {
                    headerTable.addCell(createNoBorderCell("", normalFont));
                }
            } catch (Exception e) {
                headerTable.addCell(createNoBorderCell("", normalFont));
            }

            // Company Info
            com.lowagie.text.pdf.PdfPCell companyCell = new com.lowagie.text.pdf.PdfPCell();
            companyCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            companyCell.setVerticalAlignment(com.lowagie.text.Element.ALIGN_MIDDLE);
            companyCell.addElement(new com.lowagie.text.Paragraph(org.getName().toUpperCase(), titleFont));
            String address = (org.getCity() != null ? org.getCity() + ", " : "") +
                    (org.getState() != null ? org.getState() + ", " : "") +
                    (org.getCountry() != null ? org.getCountry() : "");
            companyCell.addElement(new com.lowagie.text.Paragraph(address, normalFont));
            if (org.getEmail() != null) {
                companyCell.addElement(new com.lowagie.text.Paragraph(org.getEmail(), normalFont));
            }
            headerTable.addCell(companyCell);

            document.add(headerTable);
            document.add(new com.lowagie.text.Paragraph(" "));

            // 2. Title Strip
            com.lowagie.text.pdf.PdfPTable titleTable = new com.lowagie.text.pdf.PdfPTable(1);
            titleTable.setWidthPercentage(100);
            com.lowagie.text.pdf.PdfPCell titleCell = new com.lowagie.text.pdf.PdfPCell(
                    new com.lowagie.text.Phrase("PAYSLIP FOR " + getMonthName(payroll.getMonth()).toUpperCase()
                            + " " + payroll.getYear(), whiteFont));
            titleCell.setBackgroundColor(themeColor);
            titleCell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_CENTER);
            titleCell.setPadding(8);
            titleCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            titleTable.addCell(titleCell);
            document.add(titleTable);
            document.add(new com.lowagie.text.Paragraph(" "));

            // 3. Employee Details
            com.lowagie.text.pdf.PdfPTable detailsTable = new com.lowagie.text.pdf.PdfPTable(4);
            detailsTable.setWidthPercentage(100);
            detailsTable.setWidths(new float[] { 2, 3, 2, 3 });

            addDetailCell(detailsTable, "Employee Name:", headerFont);
            addDetailCell(detailsTable, payroll.getEmployee().getFullName(), normalFont);
            addDetailCell(detailsTable, "Employee ID:", headerFont);
            addDetailCell(detailsTable, payroll.getEmployee().getId().toString().substring(0, 8).toUpperCase(), normalFont);

            addDetailCell(detailsTable, "Designation:", headerFont);
            addDetailCell(detailsTable,
                    payroll.getEmployee().getDesignation() != null ? payroll.getEmployee().getDesignation() : "-", normalFont);
            addDetailCell(detailsTable, "Department:", headerFont);
            addDetailCell(detailsTable,
                    payroll.getEmployee().getDepartment() != null ? payroll.getEmployee().getDepartment() : "-", normalFont);

            document.add(detailsTable);
            document.add(new com.lowagie.text.Paragraph(" "));

            // 4. Salary Details Table
            com.lowagie.text.pdf.PdfPTable salaryTable = new com.lowagie.text.pdf.PdfPTable(4);
            salaryTable.setWidthPercentage(100);
            salaryTable.setHeaderRows(1);

            addHeaderCell(salaryTable, "EARNINGS", whiteFont, themeColor);
            addHeaderCell(salaryTable, "AMOUNT (INR)", whiteFont, themeColor);
            addHeaderCell(salaryTable, "DEDUCTIONS", whiteFont, themeColor);
            addHeaderCell(salaryTable, "AMOUNT (INR)", whiteFont, themeColor);

            addSalaryRow(salaryTable, "Basic Salary", payroll.getBasic(), "Provident Fund", payroll.getEpfDeduction(),
                    normalFont);
            addSalaryRow(salaryTable, "HRA", payroll.getHra(), "", null, normalFont);
            addSalaryRow(salaryTable, "DA", payroll.getDa(), "", null, normalFont);
            addSalaryRow(salaryTable, "Special Allowance", payroll.getSpecialAllowance(), "", null, normalFont);
            addSalaryRow(salaryTable, "Medical Allowance", payroll.getMedicalAllowance(), "", null, normalFont);
            addSalaryRow(salaryTable, "LTA", payroll.getLta(), "", null, normalFont);
            addSalaryRow(salaryTable, "Communication", payroll.getCommunicationAllowance(), "", null, normalFont);
            addSalaryRow(salaryTable, "Other Earnings", payroll.getOtherEarnings(), "", null, normalFont);

            // Total Row
            com.lowagie.text.pdf.PdfPCell totalLabelCell = new com.lowagie.text.pdf.PdfPCell(
                    new com.lowagie.text.Phrase("Total Earnings", headerFont));
            totalLabelCell.setBackgroundColor(headerBgColor);
            totalLabelCell.setPadding(6);
            salaryTable.addCell(totalLabelCell);

            com.lowagie.text.pdf.PdfPCell totalEarnCell = new com.lowagie.text.pdf.PdfPCell(
                    new com.lowagie.text.Phrase(formatCurrency(payroll.getTotalEarnings()), headerFont));
            totalEarnCell.setBackgroundColor(headerBgColor);
            totalEarnCell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_RIGHT);
            totalEarnCell.setPadding(6);
            salaryTable.addCell(totalEarnCell);

            com.lowagie.text.pdf.PdfPCell totalDedLabelCell = new com.lowagie.text.pdf.PdfPCell(
                    new com.lowagie.text.Phrase("Total Deductions", headerFont));
            totalDedLabelCell.setBackgroundColor(headerBgColor);
            totalDedLabelCell.setPadding(6);
            salaryTable.addCell(totalDedLabelCell);

            com.lowagie.text.pdf.PdfPCell totalDedCell = new com.lowagie.text.pdf.PdfPCell(
                    new com.lowagie.text.Phrase(formatCurrency(payroll.getTotalDeductions()), headerFont));
            totalDedCell.setBackgroundColor(headerBgColor);
            totalDedCell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_RIGHT);
            totalDedCell.setPadding(6);
            salaryTable.addCell(totalDedCell);

            document.add(salaryTable);
            document.add(new com.lowagie.text.Paragraph(" "));

            // 5. Net Pay Section
            com.lowagie.text.pdf.PdfPTable netPayTable = new com.lowagie.text.pdf.PdfPTable(1);
            netPayTable.setWidthPercentage(100);
            com.lowagie.text.pdf.PdfPCell netPayCell = new com.lowagie.text.pdf.PdfPCell();
            netPayCell.setBackgroundColor(new java.awt.Color(230, 255, 230));
            netPayCell.setPadding(10);
            netPayCell.addElement(new com.lowagie.text.Paragraph(
                    "NET PAY: " + formatCurrency(payroll.getNetPay()),
                    com.lowagie.text.FontFactory.getFont(
                            com.lowagie.text.FontFactory.HELVETICA_BOLD, 14,
                            com.lowagie.text.Font.NORMAL, new java.awt.Color(39, 174, 96))));
            netPayCell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_CENTER);
            netPayTable.addCell(netPayCell);
            document.add(netPayTable);

            // 6. Footer
            com.lowagie.text.Paragraph footer = new com.lowagie.text.Paragraph(
                    "\n\nThis is a computer-generated document and does not require a signature.", smallFont);
            footer.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Error generating PDF payslip", e);
            throw new RuntimeException("Error generating PDF", e);
        }
    }

    private void addDetailCell(com.lowagie.text.pdf.PdfPTable table, String text, com.lowagie.text.Font font) {
        com.lowagie.text.pdf.PdfPCell cell = new com.lowagie.text.pdf.PdfPCell(
                new com.lowagie.text.Phrase(text, font));
        cell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
        cell.setPadding(4);
        table.addCell(cell);
    }

    private void addHeaderCell(com.lowagie.text.pdf.PdfPTable table, String text, com.lowagie.text.Font font,
            java.awt.Color bgColor) {
        com.lowagie.text.pdf.PdfPCell cell = new com.lowagie.text.pdf.PdfPCell(
                new com.lowagie.text.Phrase(text, font));
        cell.setBackgroundColor(bgColor);
        cell.setPadding(6);
        cell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    private void addSalaryRow(com.lowagie.text.pdf.PdfPTable table, String earning, java.math.BigDecimal earnAmount,
            String deduction, java.math.BigDecimal dedAmount, com.lowagie.text.Font font) {
        com.lowagie.text.pdf.PdfPCell c1 = new com.lowagie.text.pdf.PdfPCell(
                new com.lowagie.text.Phrase(earning, font));
        c1.setPadding(5);
        table.addCell(c1);

        com.lowagie.text.pdf.PdfPCell c2 = new com.lowagie.text.pdf.PdfPCell(new com.lowagie.text.Phrase(
                earnAmount != null ? formatCurrency(earnAmount) : "0.00", font));
        c2.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_RIGHT);
        c2.setPadding(5);
        table.addCell(c2);

        com.lowagie.text.pdf.PdfPCell c3 = new com.lowagie.text.pdf.PdfPCell(
                new com.lowagie.text.Phrase(deduction != null ? deduction : "", font));
        c3.setPadding(5);
        table.addCell(c3);

        com.lowagie.text.pdf.PdfPCell c4 = new com.lowagie.text.pdf.PdfPCell(new com.lowagie.text.Phrase(
                dedAmount != null && dedAmount.compareTo(java.math.BigDecimal.ZERO) > 0
                        ? formatCurrency(dedAmount)
                        : "",
                font));
        c4.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_RIGHT);
        c4.setPadding(5);
        table.addCell(c4);
    }

    private com.lowagie.text.pdf.PdfPCell createNoBorderCell(String text, com.lowagie.text.Font font) {
        com.lowagie.text.pdf.PdfPCell cell = new com.lowagie.text.pdf.PdfPCell(
                new com.lowagie.text.Phrase(text, font));
        cell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
        return cell;
    }

    private String formatCurrency(java.math.BigDecimal amount) {
        if (amount == null)
            return "0.00";
        return String.format("%.2f", amount);
    }

    private String getMonthName(int month) {
        return java.time.Month.of(month).name();
    }
}
