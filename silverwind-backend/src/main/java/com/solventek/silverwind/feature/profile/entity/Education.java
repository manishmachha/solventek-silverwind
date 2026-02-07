package com.solventek.silverwind.feature.profile.entity;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.common.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "profile_education")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Education extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnore
    private Employee employee;

    @Column(nullable = false)
    private String institution;

    @Column(nullable = false)
    private String degree;

    private String fieldOfStudy;

    private LocalDate startDate;
    private LocalDate endDate;

    private String grade; // e.g., "3.8/4.0", "A"

    @Column(columnDefinition = "TEXT")
    private String description;
}
