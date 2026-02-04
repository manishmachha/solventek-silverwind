package com.solventek.silverwind.projects;

import com.solventek.silverwind.org.Organization;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "projects")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Project {
    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_org_id")
    private Organization client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "internal_org_id", nullable = false)
    private Organization internalOrg; // The solventek/vendor org owning the project

    private LocalDate startDate;
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    private ProjectStatus status;

    public enum ProjectStatus {
        ACTIVE, COMPLETED, ON_HOLD, PLANNED
    }

    @OneToMany(mappedBy = "project", fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("project")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private java.util.List<ProjectAllocation> allocations;
}
