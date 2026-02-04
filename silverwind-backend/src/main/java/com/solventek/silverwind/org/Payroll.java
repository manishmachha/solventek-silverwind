package com.solventek.silverwind.org;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "payrolls", uniqueConstraints = {
        @UniqueConstraint(name = "uk_payroll_user_month_year", columnNames = { "user_id", "month", "year" })
}, indexes = {
        @Index(name = "idx_payroll_user", columnList = "user_id"),
        @Index(name = "idx_payroll_org", columnList = "org_id"),
        @Index(name = "idx_payroll_period", columnList = "month, year")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payroll extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_payroll_user"))
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "org_id", nullable = false, foreignKey = @ForeignKey(name = "fk_payroll_org"))
    private Organization organization;

    @NotNull
    @Column(nullable = false)
    private Integer month; // 1-12

    @NotNull
    @Column(nullable = false)
    private Integer year;

    // Snapshot of salary breakdown
    @NotNull
    @DecimalMin(value = "0.0")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal basic;

    @NotNull
    @DecimalMin(value = "0.0")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal da;

    @NotNull
    @DecimalMin(value = "0.0")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal hra;

    @NotNull
    @DecimalMin(value = "0.0")
    @Column(name = "medical_allowance", nullable = false, precision = 12, scale = 2)
    private BigDecimal medicalAllowance;

    @NotNull
    @DecimalMin(value = "0.0")
    @Column(name = "special_allowance", nullable = false, precision = 12, scale = 2)
    private BigDecimal specialAllowance;

    @NotNull
    @DecimalMin(value = "0.0")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal lta;

    @NotNull
    @DecimalMin(value = "0.0")
    @Column(name = "communication_allowance", nullable = false, precision = 12, scale = 2)
    private BigDecimal communicationAllowance;

    @NotNull
    @DecimalMin(value = "0.0")
    @Column(name = "other_earnings", nullable = false, precision = 12, scale = 2)
    private BigDecimal otherEarnings;

    @NotNull
    @DecimalMin(value = "0.0")
    @Column(name = "epf_deduction", nullable = false, precision = 12, scale = 2)
    private BigDecimal epfDeduction;

    @NotNull
    @DecimalMin(value = "0.0")
    @Column(name = "total_earnings", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalEarnings;

    @NotNull
    @DecimalMin(value = "0.0")
    @Column(name = "total_deductions", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalDeductions;

    @NotNull
    @DecimalMin(value = "0.0")
    @Column(name = "net_pay", nullable = false, precision = 12, scale = 2)
    private BigDecimal netPay;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @NotNull
    @Size(max = 20)
    @Column(nullable = false, length = 20)
    private String status; // PENDING, PAID
}
