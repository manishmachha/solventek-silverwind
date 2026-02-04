package com.solventek.silverwind.org;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "salary_structures", uniqueConstraints = {
        @UniqueConstraint(name = "uk_salary_structure_user", columnNames = "user_id")
}, indexes = {
        @Index(name = "idx_salary_structure_org", columnList = "org_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalaryStructure extends BaseEntity {

    @NotNull
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_salary_structure_user"))
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "org_id", nullable = false, foreignKey = @ForeignKey(name = "fk_salary_structure_org"))
    private Organization organization;

    @NotNull
    @DecimalMin(value = "0.0")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal basic;

    @NotNull
    @DecimalMin(value = "0.0")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal da; // Dearness Allowance

    @NotNull
    @DecimalMin(value = "0.0")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal hra; // House Rent Allowance

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
    private BigDecimal lta; // Leave Travel Allowance

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

    // Helper to calculate total CTC
    public BigDecimal calculateCtc() {
        return basic.add(da).add(hra).add(medicalAllowance)
                .add(specialAllowance).add(lta).add(communicationAllowance).add(otherEarnings);
    }
}
