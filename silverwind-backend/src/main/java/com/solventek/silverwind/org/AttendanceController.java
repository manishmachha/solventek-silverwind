package com.solventek.silverwind.org;

import com.solventek.silverwind.common.ApiResponse;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

/**
 * Attendance management controller - Solventek employees only
 */
@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
@Slf4j
public class AttendanceController {

    private final AttendanceService attendanceService;

    // ============ EMPLOYEE SELF-SERVICE ENDPOINTS ============

    @PostMapping("/check-in")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkIn(@RequestParam UUID userId) {
        return ResponseEntity.ok(ApiResponse.success("Checked in successfully.", toAttendanceResponse(attendanceService.checkIn(getCurrentUserId()))));
    }

    @PostMapping("/check-out")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkOut() {
        return ResponseEntity.ok(ApiResponse.success("Checked out successfully.", toAttendanceResponse(attendanceService.checkOut(getCurrentUserId()))));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getMyAttendance() {
        log.info("API: Get My Attendance");
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getMyAttendance().stream().map(this::toAttendanceResponse).toList()));
    }

    @GetMapping("/my/range")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getMyAttendanceByRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("API: Get My Attendance Range {} to {}", startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getMyAttendanceByRange(startDate, endDate).stream().map(this::toAttendanceResponse)
                .toList()));
    }

    @GetMapping("/timesheet/my")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<TimesheetSummary>> getMyTimesheet(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("API: Get My Timesheet {} to {}", startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getMyTimesheet(startDate, endDate)));
    }

    // ============ ADMIN ENDPOINTS ============

    @GetMapping("/employee/{userId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getEmployeeAttendance(@PathVariable UUID userId) {
        log.info("API: Get Employee {} Attendance", userId);
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getAttendanceByEmployee(userId).stream().map(this::toAttendanceResponse).toList()));
    }

    @GetMapping("/employee/{userId}/range")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getEmployeeAttendanceByRange(
            @PathVariable UUID userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("API: Get Employee {} Attendance Range", userId);
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getAttendanceByEmployeeAndRange(userId, startDate, endDate).stream()
                .map(this::toAttendanceResponse).toList()));
    }

    @GetMapping("/date")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getAttendanceByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        log.info("API: Get Attendance By Date {}", date);
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getAttendanceByDate(date).stream().map(this::toAttendanceResponse).toList()));
    }

    @GetMapping("/range")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getAttendanceByRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("API: Get Attendance Range All Employees");
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getAttendanceByRange(startDate, endDate).stream().map(this::toAttendanceResponse)
                .toList()));
    }

    @PostMapping("/mark")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<AttendanceResponse>> markAttendance(
            @RequestParam UUID userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam AttendanceStatus status,
            @RequestParam(required = false) String notes) {
        log.info("API: Mark Attendance User: {}, Date: {}, Status: {}", userId, date, status);
        return ResponseEntity.ok(ApiResponse.success("Attendance marked successfully.", toAttendanceResponse(attendanceService.adminMarkAttendance(userId, date, status, notes))));
    }

    @GetMapping("/timesheet/{userId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<TimesheetSummary>> getEmployeeTimesheet(
            @PathVariable UUID userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("API: Get Employee {} Timesheet", userId);
        return ResponseEntity.ok(ApiResponse.success(attendanceService.generateTimesheet(userId, startDate, endDate)));
    }

    // ============ DOWNLOAD ENDPOINTS ============

    @GetMapping("/timesheet/my/download")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<byte[]> downloadMyTimesheet(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("API: Download My Timesheet {} to {}", startDate, endDate);
        byte[] pdfBytes = attendanceService.generateTimesheetPdf(getCurrentUserId(), startDate, endDate);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=timesheet_" + startDate + "_" + endDate + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    @GetMapping("/timesheet/{userId}/download")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<byte[]> downloadEmployeeTimesheet(
            @PathVariable UUID userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("API: Download Employee {} Timesheet", userId);
        byte[] pdfBytes = attendanceService.generateTimesheetPdf(userId, startDate, endDate);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=timesheet_" + userId + "_" + startDate + "_" + endDate + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    // ============ HELPER & DTOs ============

    private UUID getCurrentUserId() {
        return ((com.solventek.silverwind.security.UserPrincipal) org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication().getPrincipal()).getId();
    }

    private AttendanceResponse toAttendanceResponse(Attendance a) {
        return AttendanceResponse.builder()
                .id(a.getId())
                .userId(a.getEmployee().getId())
                .userName(a.getEmployee().getFullName())
                .date(a.getDate())
                .checkInTime(a.getCheckInTime())
                .checkOutTime(a.getCheckOutTime())
                .status(a.getStatus())
                .notes(a.getNotes())
                .build();
    }

    @Data
    @Builder
    public static class AttendanceResponse {
        private UUID id;
        private UUID userId;
        private String userName;
        private LocalDate date;
        private LocalTime checkInTime;
        private LocalTime checkOutTime;
        private AttendanceStatus status;
        private String notes;
    }
}
