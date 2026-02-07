package com.solventek.silverwind.feature.profile.entity;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.common.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "profile_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnore
    private Employee employee;

    @Column(nullable = false)
    private String documentType; // e.g., Resume, ID Proof, Contract

    @Column(nullable = false)
    private String documentName;

    @Column(length = 2048)
    private String fileUrl;

    private String storageKey; // For S3/Local deletion
}
