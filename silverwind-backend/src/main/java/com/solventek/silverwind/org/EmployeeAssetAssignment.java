package com.solventek.silverwind.org;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.common.BaseEntity;
import com.solventek.silverwind.enums.AssetAssignmentStatus;
import com.solventek.silverwind.enums.AssetCondition;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "employee_asset_assignments", indexes = {
        @Index(name = "idx_asset_assign_employee", columnList = "employee_id"),
        @Index(name = "idx_asset_assign_asset", columnList = "asset_id"),
        @Index(name = "idx_asset_assign_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeAssetAssignment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false, foreignKey = @ForeignKey(name = "fk_asset_assign_employee"))
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "asset_id", nullable = false, foreignKey = @ForeignKey(name = "fk_asset_assign_asset"))
    private Asset asset;

    @Column(name = "assigned_on", nullable = false)
    private LocalDate assignedOn;

    @Column(name = "returned_on")
    private LocalDate returnedOn;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_on_assign", nullable = false, length = 30)
    private AssetCondition conditionOnAssign;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_on_return", length = 30)
    private AssetCondition conditionOnReturn;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AssetAssignmentStatus status;

    @Size(max = 2000)
    @Column(length = 2000)
    private String notes;
}
