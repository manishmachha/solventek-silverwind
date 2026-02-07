package com.solventek.silverwind.feature.profile.entity;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.common.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "profile_certifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Certification extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnore
    private Employee employee;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String issuingOrganization;

    private LocalDate issueDate;
    private LocalDate expirationDate;

    private String credentialId;
    
    @Column(length = 2048)
    private String credentialUrl;
}
