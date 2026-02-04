package com.solventek.silverwind.onboarding;

import com.solventek.silverwind.applications.JobApplication;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "onboardings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Onboarding {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "application_id", nullable = false)
    private JobApplication application;

    @Enumerated(EnumType.STRING)
    private OnboardingStatus status;

    private LocalDate startDate; // Optional: Joining Date

    @ElementCollection
    @CollectionTable(name = "onboarding_documents", joinColumns = @JoinColumn(name = "onboarding_id"))
    @Column(name = "document_url")
    @Builder.Default
    private List<String> documents = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
