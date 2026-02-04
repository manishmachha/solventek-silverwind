package com.solventek.silverwind.org;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Payroll management controller - Solventek HR only
 */
@RestController
@RequestMapping("/api/payroll")
@RequiredArgsConstructor
@Slf4j
public class PayrollController {

    private final PayrollService payrollService;

    // ============ EMPLOYEE SELF-SERVICE ENDPOINTS ============

    @GetMapping("/my-slips")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public List<PayrollResponse> getMyPayslips() {
        log.info("API: Get My Payslips");
        return payrollService.getMyPayslips().stream().map(this::toPayrollResponse).toList();
    }

    @GetMapping("/my-structure")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public SalaryStructureResponse getMySalaryStructure() {
        log.info("API: Get My Salary Structure");
        return toStructureResponse(payrollService.getMySalaryStructure());
    }

    @GetMapping("/my/history")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public List<PayrollResponse> getMyPayrollHistory(@RequestParam int year) {
        log.info("API: Get My Payroll History for year {}", year);
        return payrollService.getMyPayslipsByYear(year).stream().map(this::toPayrollResponse).toList();
    }

    @GetMapping("/salary-revisions/my")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public List<SalaryRevisionResponse> getMySalaryRevisions() {
        log.info("API: Get My Salary Revisions");
        return payrollService.getMySalaryRevisions().stream().map(this::toRevisionResponse).toList();
    }

    @GetMapping("/{payrollId}/download")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<byte[]> downloadPayslip(@PathVariable UUID payrollId) {
        log.info("API: Download Payslip {}", payrollId);
        byte[] pdfBytes = payrollService.generatePayslipPdf(payrollId);
        Payroll payroll = payrollService.getPayrollById(payrollId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=payslip_" + payroll.getMonth() + "_" + payroll.getYear() + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    // ============ ADMIN ENDPOINTS ============

    @GetMapping("/structures")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public List<SalaryStructureResponse> getAllSalaryStructures() {
        log.info("API: List All Salary Structures");
        return payrollService.listAllSalaryStructures().stream().map(this::toStructureResponse).toList();
    }

    @GetMapping("/employee/{userId}/structure")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public SalaryStructureResponse getEmployeeSalaryStructure(@PathVariable UUID userId) {
        log.info("API: Get Salary Structure for user {}", userId);
        return toStructureResponse(payrollService.getSalaryStructure(userId));
    }

    @PostMapping("/employee/{userId}/structure")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public SalaryStructureResponse saveSalaryStructure(
            @PathVariable UUID userId,
            @RequestParam BigDecimal basic,
            @RequestParam BigDecimal da,
            @RequestParam BigDecimal hra,
            @RequestParam BigDecimal medicalAllowance,
            @RequestParam BigDecimal specialAllowance,
            @RequestParam BigDecimal lta,
            @RequestParam BigDecimal communicationAllowance,
            @RequestParam BigDecimal otherEarnings,
            @RequestParam BigDecimal epfDeduction) {
        log.info("API: Save Salary Structure for user {}", userId);
        SalaryStructure saved = payrollService.saveSalaryStructure(userId, basic, da, hra, medicalAllowance,
                specialAllowance, lta, communicationAllowance, otherEarnings, epfDeduction);
        return toStructureResponse(saved);
    }

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public PayrollResponse generatePayroll(@RequestParam UUID userId,
            @RequestParam int month,
            @RequestParam int year) {
        log.info("API: Generate Payroll for user {} for {}/{}", userId, month, year);
        return toPayrollResponse(payrollService.generatePayroll(userId, month, year));
    }

    @PatchMapping("/{payrollId}/pay")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public PayrollResponse markAsPaid(@PathVariable UUID payrollId) {
        log.info("API: Mark Payroll {} as Paid", payrollId);
        return toPayrollResponse(payrollService.markAsPaid(payrollId));
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public List<PayrollResponse> getPayrollHistory(@RequestParam int month, @RequestParam int year) {
        log.info("API: Get Payroll History for {}/{}", month, year);
        return payrollService.getPayrollsByMonth(month, year).stream().map(this::toPayrollResponse).toList();
    }

    @GetMapping("/employee/{userId}/history")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public List<PayrollResponse> getEmployeePayrollHistory(@PathVariable UUID userId) {
        log.info("API: Get Payroll History for user {}", userId);
        return payrollService.getPayrollsByUser(userId).stream().map(this::toPayrollResponse).toList();
    }

    @GetMapping("/salary-revisions/{userId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public List<SalaryRevisionResponse> getEmployeeSalaryRevisions(@PathVariable UUID userId) {
        log.info("API: Get Salary Revisions for user {}", userId);
        return payrollService.getSalaryRevisions(userId).stream().map(this::toRevisionResponse).toList();
    }

    // ============ RESPONSE MAPPING ============

    private PayrollResponse toPayrollResponse(Payroll p) {
        return PayrollResponse.builder()
                .id(p.getId())
                .userId(p.getEmployee().getId())
                .userName(p.getEmployee().getFullName())
                .month(p.getMonth())
                .year(p.getYear())
                .basic(p.getBasic())
                .da(p.getDa())
                .hra(p.getHra())
                .medicalAllowance(p.getMedicalAllowance())
                .specialAllowance(p.getSpecialAllowance())
                .lta(p.getLta())
                .communicationAllowance(p.getCommunicationAllowance())
                .otherEarnings(p.getOtherEarnings())
                .epfDeduction(p.getEpfDeduction())
                .totalEarnings(p.getTotalEarnings())
                .totalDeductions(p.getTotalDeductions())
                .netPay(p.getNetPay())
                .paymentDate(p.getPaymentDate())
                .status(p.getStatus())
                .build();
    }

    private SalaryStructureResponse toStructureResponse(SalaryStructure s) {
        return SalaryStructureResponse.builder()
                .id(s.getId())
                .userId(s.getEmployee().getId())
                .userName(s.getEmployee().getFullName())
                .basic(s.getBasic())
                .da(s.getDa())
                .hra(s.getHra())
                .medicalAllowance(s.getMedicalAllowance())
                .specialAllowance(s.getSpecialAllowance())
                .lta(s.getLta())
                .communicationAllowance(s.getCommunicationAllowance())
                .otherEarnings(s.getOtherEarnings())
                .epfDeduction(s.getEpfDeduction())
                .ctc(s.calculateCtc())
                .build();
    }

    private SalaryRevisionResponse toRevisionResponse(SalaryRevision r) {
        return SalaryRevisionResponse.builder()
                .id(r.getId())
                .userId(r.getEmployee().getId())
                .userName(r.getEmployee().getFullName())
                .revisionDate(r.getRevisionDate())
                .oldCtc(r.getOldCtc())
                .newCtc(r.getNewCtc())
                .changeReason(r.getChangeReason())
                .build();
    }

    // ============ DTOs ============

    @lombok.Builder
    @lombok.Data
    public static class PayrollResponse {
        private UUID id;
        private UUID userId;
        private String userName;
        private int month;
        private int year;
        private BigDecimal basic;
        private BigDecimal da;
        private BigDecimal hra;
        private BigDecimal medicalAllowance;
        private BigDecimal specialAllowance;
        private BigDecimal lta;
        private BigDecimal communicationAllowance;
        private BigDecimal otherEarnings;
        private BigDecimal epfDeduction;
        private BigDecimal totalEarnings;
        private BigDecimal totalDeductions;
        private BigDecimal netPay;
        private LocalDate paymentDate;
        private String status;
    }

    @lombok.Builder
    @lombok.Data
    public static class SalaryStructureResponse {
        private UUID id;
        private UUID userId;
        private String userName;
        private BigDecimal basic;
        private BigDecimal da;
        private BigDecimal hra;
        private BigDecimal medicalAllowance;
        private BigDecimal specialAllowance;
        private BigDecimal lta;
        private BigDecimal communicationAllowance;
        private BigDecimal otherEarnings;
        private BigDecimal epfDeduction;
        private BigDecimal ctc;
    }

    @lombok.Builder
    @lombok.Data
    public static class SalaryRevisionResponse {
        private UUID id;
        private UUID userId;
        private String userName;
        private LocalDate revisionDate;
        private BigDecimal oldCtc;
        private BigDecimal newCtc;
        private String changeReason;
    }
}
