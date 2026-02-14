package com.solventek.silverwind.client.submission;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.solventek.silverwind.client.Client;
import com.solventek.silverwind.common.BaseEntity;
import com.solventek.silverwind.jobs.Job;
import com.solventek.silverwind.recruitment.Candidate;
import com.solventek.silverwind.auth.Employee;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "client_submissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class ClientSubmission extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "resumeText", "experienceDetailsJson",
            "educationDetailsJson", "aiAnalysisJson" })
    private Candidate candidate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Job job; // Optional, can submit to client generally

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClientSubmissionStatus status;

    private String externalReferenceId; // ID in client's portal

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by_id")
    private Employee submittedBy;

    private LocalDateTime submittedAt;

    @PrePersist
    public void onPrePersist() {
        if (submittedAt == null) {
            submittedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = ClientSubmissionStatus.SUBMITTED;
        }
    }
}
