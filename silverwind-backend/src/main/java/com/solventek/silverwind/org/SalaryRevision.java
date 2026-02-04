package com.solventek.silverwind.org;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "salary_revisions", indexes = {
        @Index(name = "idx_salary_revision_user", columnList = "user_id"),
        @Index(name = "idx_salary_revision_date", columnList = "revision_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalaryRevision extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_salary_revision_user"))
    private Employee employee;

    @NotNull
    @Column(name = "revision_date", nullable = false)
    private LocalDate revisionDate;

    @NotNull
    @Column(name = "old_ctc", nullable = false, precision = 12, scale = 2)
    private BigDecimal oldCtc;

    @NotNull
    @Column(name = "new_ctc", nullable = false, precision = 12, scale = 2)
    private BigDecimal newCtc;

    @Size(max = 500)
    @Column(name = "change_reason", length = 500)
    private String changeReason;
}
