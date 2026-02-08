package com.solventek.silverwind.chat;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.auth.EmployeeRepository;
import com.solventek.silverwind.feature.leave.dto.LeaveBalanceDTO;
import com.solventek.silverwind.feature.leave.dto.LeaveRequestDTO;
import com.solventek.silverwind.feature.leave.dto.LeaveResponseDTO;
import com.solventek.silverwind.feature.leave.service.LeaveOperationService;
import com.solventek.silverwind.org.*;
import com.solventek.silverwind.projects.Project;
import com.solventek.silverwind.projects.ProjectService;
import com.solventek.silverwind.security.UserPrincipal;
import com.solventek.silverwind.ticket.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Tool Registry for Spring AI Function Calling.
 * Each @Tool method becomes available to the AI for ACTION intents.
 * Works identically in local-dev and prod-S3 environments.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class ToolRegistry {

    private final EmployeeRepository employeeRepository;
    private final LeaveOperationService leaveOperationService;
    private final TicketService ticketService;
    private final PayrollService payrollService;
    private final AttendanceService attendanceService;
    private final HolidayService holidayService;
    private final ProjectService projectService;

    // ===== Helper Methods =====

    private UUID getCurrentUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal userPrincipal) {
            return userPrincipal.getId();
        }
        throw new RuntimeException("User not authenticated");
    }

    private Employee getCurrentEmployee() {
        return employeeRepository.findById(getCurrentUserId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));
    }

    private UUID getCurrentOrgId() {
        Employee emp = getCurrentEmployee();
        return emp.getOrganization().getId();
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return LocalDate.now();
        try {
            return LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (Exception e) {
            String[] formats = {"yyyy-MM-dd", "dd-MM-yyyy", "MM/dd/yyyy", "dd/MM/yyyy"};
            for (String fmt : formats) {
                try {
                    return LocalDate.parse(dateStr, DateTimeFormatter.ofPattern(fmt));
                } catch (Exception ignored) {}
            }
            throw new RuntimeException("Invalid date format: " + dateStr + ". Use YYYY-MM-DD.");
        }
    }

    // ===== Profile Tools =====

    @Tool(description = "Get the current user's profile details including name, email, department, designation, and contact info.")
    public String getMyProfile() {
        log.info("TOOL: getMyProfile");
        try {
            Employee emp = getCurrentEmployee();
            return String.format("""
                    ## My Profile
                    
                    | Field | Value |
                    | --- | --- |
                    | Name | %s %s |
                    | Email | %s |
                    | Phone | %s |
                    | Department | %s |
                    | Designation | %s |
                    | Employee Code | %s |
                    | Date of Joining | %s |
                    | Status | %s |
                    """,
                    emp.getFirstName(), emp.getLastName(),
                    emp.getEmail(),
                    emp.getPhone() != null ? emp.getPhone() : "N/A",
                    emp.getDepartment() != null ? emp.getDepartment() : "N/A",
                    emp.getDesignation() != null ? emp.getDesignation() : "N/A",
                    emp.getEmployeeCode() != null ? emp.getEmployeeCode() : "N/A",
                    emp.getDateOfJoining() != null ? emp.getDateOfJoining().toString() : "N/A",
                    emp.getEmploymentStatus() != null ? emp.getEmploymentStatus().name() : "N/A");
        } catch (Exception e) {
            log.error("Error in getMyProfile", e);
            return "Error fetching profile: " + e.getMessage();
        }
    }

    // ===== Leave Tools =====

    @Tool(description = "Get the current user's leave balance for all leave types in the current year.")
    public String getLeaveBalance() {
        log.info("TOOL: getLeaveBalance");
        try {
            UUID userId = getCurrentUserId();
            int year = LocalDate.now().getYear();
            List<LeaveBalanceDTO> balances = leaveOperationService.getMyBalances(userId, year);

            if (balances.isEmpty()) {
                return "No leave balances found for this year.";
            }

            StringBuilder sb = new StringBuilder("## Leave Balance (" + year + ")\n\n");
            sb.append("| Leave Type | Allocated | Used | Remaining |\n");
            sb.append("| --- | --- | --- | --- |\n");

            for (LeaveBalanceDTO bal : balances) {
                sb.append(String.format("| %s | %.1f | %.1f | %.1f |\n",
                        bal.getLeaveTypeName(),
                        bal.getAllocatedDays(),
                        bal.getUsedDays(),
                        bal.getRemainingDays()));
            }
            return sb.toString();
        } catch (Exception e) {
            log.error("Error in getLeaveBalance", e);
            return "Error fetching leave balance: " + e.getMessage();
        }
    }

    @Tool(description = "Get the current user's leave requests history.")
    public String getMyLeaves() {
        log.info("TOOL: getMyLeaves");
        try {
            UUID userId = getCurrentUserId();
            List<LeaveResponseDTO> leaves = leaveOperationService.getMyRequests(userId);

            if (leaves.isEmpty()) {
                return "No leave requests found.";
            }

            StringBuilder sb = new StringBuilder("## My Leave Requests\n\n");
            sb.append("| Type | Start | End | Status | Reason |\n");
            sb.append("| --- | --- | --- | --- | --- |\n");

            for (LeaveResponseDTO leave : leaves) {
                sb.append(String.format("| %s | %s | %s | %s | %s |\n",
                        leave.getLeaveTypeName(),
                        leave.getStartDate(),
                        leave.getEndDate(),
                        leave.getStatus() != null ? leave.getStatus().name() : "N/A",
                        leave.getReason() != null ? leave.getReason() : "-"));
            }
            return sb.toString();
        } catch (Exception e) {
            log.error("Error in getMyLeaves", e);
            return "Error fetching leaves: " + e.getMessage();
        }
    }

    @Tool(description = "Apply for leave. Provide start date, end date (YYYY-MM-DD format), leave type ID, and reason.")
    public String applyForLeave(
            @ToolParam(description = "Start date in YYYY-MM-DD format") String startDate,
            @ToolParam(description = "End date in YYYY-MM-DD format") String endDate,
            @ToolParam(description = "Leave type ID (UUID)") String leaveTypeId,
            @ToolParam(description = "Reason for leave") String reason) {
        log.info("TOOL: applyForLeave - {} to {} type={}", startDate, endDate, leaveTypeId);
        try {
            UUID userId = getCurrentUserId();
            LeaveRequestDTO dto = new LeaveRequestDTO();
            dto.setLeaveTypeId(UUID.fromString(leaveTypeId));
            dto.setStartDate(parseDate(startDate));
            dto.setEndDate(parseDate(endDate));
            dto.setReason(reason);
            
            // submitLeaveRequest returns void, but throws on error
            leaveOperationService.submitLeaveRequest(userId, dto);
            
            return String.format("✅ Leave request submitted successfully!\n" +
                            "**Dates**: %s to %s\n**Status**: Pending approval",
                    dto.getStartDate(), dto.getEndDate());
        } catch (Exception e) {
            log.error("Error in applyForLeave", e);
            return "❌ Failed to apply for leave: " + e.getMessage();
        }
    }

    // ===== Attendance Tools =====

    @Tool(description = "Get the current user's attendance summary for the current month.")
    public String getAttendanceSummary() {
        log.info("TOOL: getAttendanceSummary");
        try {
            LocalDate today = LocalDate.now();
            LocalDate startOfMonth = today.withDayOfMonth(1);

            var records = attendanceService.getMyAttendanceByRange(startOfMonth, today);

            if (records.isEmpty()) {
                return "No attendance records found for this month.";
            }

            long presentDays = records.stream()
                    .filter(a -> a.getStatus() == AttendanceStatus.PRESENT)
                    .count();
            long absentDays = records.stream()
                    .filter(a -> a.getStatus() == AttendanceStatus.ABSENT)
                    .count();
            long halfDays = records.stream()
                    .filter(a -> a.getStatus() == AttendanceStatus.HALF_DAY)
                    .count();
            long onLeaveDays = records.stream()
                    .filter(a -> a.getStatus() == AttendanceStatus.ON_LEAVE)
                    .count();

            return String.format("""
                    ## Attendance Summary (%s)
                    
                    | Metric | Value |
                    | --- | --- |
                    | Present Days | %d |
                    | Absent Days | %d |
                    | Half Days | %d |
                    | On Leave | %d |
                    | Total Records | %d |
                    """,
                    today.getMonth().name(),
                    presentDays, absentDays, halfDays, onLeaveDays, records.size());
        } catch (Exception e) {
            log.error("Error in getAttendanceSummary", e);
            return "Error fetching attendance: " + e.getMessage();
        }
    }

    // ===== Holiday Tools =====

    @Tool(description = "Get upcoming holidays for the organization.")
    public String getUpcomingHolidays() {
        log.info("TOOL: getUpcomingHolidays");
        try {
            UUID orgId = getCurrentOrgId();
            List<Holiday> holidays = holidayService.getAllHolidays(orgId);

            LocalDate today = LocalDate.now();
            List<Holiday> upcoming = holidays.stream()
                    .filter(h -> !h.getDate().isBefore(today))
                    .sorted((a, b) -> a.getDate().compareTo(b.getDate()))
                    .limit(10)
                    .collect(Collectors.toList());

            if (upcoming.isEmpty()) {
                return "No upcoming holidays found.";
            }

            StringBuilder sb = new StringBuilder("## Upcoming Holidays\n\n");
            sb.append("| Date | Name | Mandatory |\n");
            sb.append("| --- | --- | --- |\n");

            for (Holiday h : upcoming) {
                sb.append(String.format("| %s | %s | %s |\n",
                        h.getDate(), h.getName(), h.isMandatory() ? "Yes" : "No"));
            }
            return sb.toString();
        } catch (Exception e) {
            log.error("Error in getUpcomingHolidays", e);
            return "Error fetching holidays: " + e.getMessage();
        }
    }

    // ===== Payroll Tools =====

    @Tool(description = "Get the current user's payslips for the current year.")
    public String getMyPayslips() {
        log.info("TOOL: getMyPayslips");
        try {
            List<Payroll> payslips = payrollService.getMyPayslips();

            if (payslips.isEmpty()) {
                return "No payslips found.";
            }

            StringBuilder sb = new StringBuilder("## My Payslips\n\n");
            sb.append("| Month | Year | Net Pay | Status |\n");
            sb.append("| --- | --- | --- | --- |\n");

            for (Payroll p : payslips) {
                sb.append(String.format("| %s | %d | ₹%.2f | %s |\n",
                        java.time.Month.of(p.getMonth()).name(),
                        p.getYear(),
                        p.getNetPay() != null ? p.getNetPay().doubleValue() : 0.0,
                        p.getStatus() != null ? p.getStatus() : "N/A"));
            }
            return sb.toString();
        } catch (Exception e) {
            log.error("Error in getMyPayslips", e);
            return "Error fetching payslips: " + e.getMessage();
        }
    }

    // ===== Ticket Tools =====

    @Tool(description = "Get the current user's support tickets.")
    public String getMyTickets() {
        log.info("TOOL: getMyTickets");
        try {
            UUID userId = getCurrentUserId();
            List<Ticket> tickets = ticketService.getMyTickets(userId);

            if (tickets.isEmpty()) {
                return "No tickets found.";
            }

            StringBuilder sb = new StringBuilder("## My Tickets\n\n");
            sb.append("| Number | Subject | Status | Priority | Created |\n");
            sb.append("| --- | --- | --- | --- | --- |\n");

            for (Ticket t : tickets) {
                String createdDate = t.getCreatedAt() != null 
                        ? t.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate().toString()
                        : "N/A";
                sb.append(String.format("| %s | %s | %s | %s | %s |\n",
                        t.getTicketNumber(),
                        t.getSubject(),
                        t.getStatus().name(),
                        t.getPriority().name(),
                        createdDate));
            }
            return sb.toString();
        } catch (Exception e) {
            log.error("Error in getMyTickets", e);
            return "Error fetching tickets: " + e.getMessage();
        }
    }

    @Tool(description = "Create a new support ticket.")
    public String createTicket(
            @ToolParam(description = "Ticket subject/title") String subject,
            @ToolParam(description = "Detailed description of the issue") String description,
            @ToolParam(description = "Ticket type: IT_SUPPORT, HR, FACILITIES, GENERAL") String type,
            @ToolParam(description = "Priority: LOW, MEDIUM, HIGH, CRITICAL") String priority) {
        log.info("TOOL: createTicket - {} type={} priority={}", subject, type, priority);
        try {
            UUID userId = getCurrentUserId();
            UUID orgId = getCurrentOrgId();

            TicketType ticketType = TicketType.valueOf(type.toUpperCase());
            TicketPriority ticketPriority = TicketPriority.valueOf(priority.toUpperCase());

            Ticket ticket = ticketService.createTicket(userId, subject, description, ticketType, ticketPriority, orgId, null);

            return String.format("✅ Ticket created successfully!\n" +
                            "**Number**: %s\n**Subject**: %s\n**Status**: %s",
                    ticket.getTicketNumber(), ticket.getSubject(), ticket.getStatus().name());
        } catch (Exception e) {
            log.error("Error in createTicket", e);
            return "❌ Failed to create ticket: " + e.getMessage();
        }
    }

    // ===== Project Tools =====

    @Tool(description = "Get projects the current user is allocated to.")
    public String getMyProjects() {
        log.info("TOOL: getMyProjects");
        try {
            UUID orgId = getCurrentOrgId();
            List<Project> projects = projectService.getMyProjects(orgId);

            if (projects.isEmpty()) {
                return "No projects found.";
            }

            StringBuilder sb = new StringBuilder("## My Projects\n\n");
            sb.append("| Name | Status | Start | End |\n");
            sb.append("| --- | --- | --- | --- |\n");

            for (Project p : projects) {
                sb.append(String.format("| %s | %s | %s | %s |\n",
                        p.getName(),
                        p.getStatus() != null ? p.getStatus().name() : "N/A",
                        p.getStartDate() != null ? p.getStartDate().toString() : "N/A",
                        p.getEndDate() != null ? p.getEndDate().toString() : "N/A"));
            }
            return sb.toString();
        } catch (Exception e) {
            log.error("Error in getMyProjects", e);
            return "Error fetching projects: " + e.getMessage();
        }
    }

    @Tool(description = "Get all projects in the organization.")
    public String getAllProjects() {
        log.info("TOOL: getAllProjects");
        try {
            UUID orgId = getCurrentOrgId();
            List<Project> projects = projectService.getMyProjects(orgId);

            if (projects.isEmpty()) {
                return "No projects found in the organization.";
            }

            StringBuilder sb = new StringBuilder("## All Projects\n\n");
            sb.append("| Name | Status | Client | Start | End |\n");
            sb.append("| --- | --- | --- | --- | --- |\n");

            for (Project p : projects) {
                String clientName = p.getClient() != null ? p.getClient().getName() : "N/A";
                sb.append(String.format("| %s | %s | %s | %s | %s |\n",
                        p.getName(),
                        p.getStatus() != null ? p.getStatus().name() : "N/A",
                        clientName,
                        p.getStartDate() != null ? p.getStartDate().toString() : "N/A",
                        p.getEndDate() != null ? p.getEndDate().toString() : "N/A"));
            }
            return sb.toString();
        } catch (Exception e) {
            log.error("Error in getAllProjects", e);
            return "Error fetching projects: " + e.getMessage();
        }
    }
}
