package com.solventek.silverwind.feature.leave.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "leave_types", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "name", "organization_id" })
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveType {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID organizationId;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "default_days_per_year")
    private int defaultDaysPerYear;

    @Column(name = "carry_forward_allowed")
    private boolean carryForwardAllowed;

    @Column(name = "is_active")
    private boolean isActive;

    @Enumerated(EnumType.STRING)
    @Column(name = "accrual_frequency")
    private AccrualFrequency accrualFrequency;

    @Column(name = "max_days_per_month")
    private Integer maxDaysPerMonth;

    @Column(name = "max_consecutive_days")
    private Integer maxConsecutiveDays;

    @Column(name = "requires_approval")
    private boolean requiresApproval;
}
