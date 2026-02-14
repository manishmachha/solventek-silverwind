package com.solventek.silverwind.projects;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.recruitment.Candidate;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "project_allocations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectAllocation {
    @Id
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id")
    private Candidate candidate;

    private LocalDate startDate;
    private LocalDate endDate;

    private Integer allocationPercentage; // e.g. 100, 50
    private String billingRole; // e.g. Senior Dev

    @Enumerated(EnumType.STRING)
    private AllocationStatus status;

    public enum AllocationStatus {
        ACTIVE, ENDED, PLANNED
    }
}
