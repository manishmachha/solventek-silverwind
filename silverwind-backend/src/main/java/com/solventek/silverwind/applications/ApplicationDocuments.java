package com.solventek.silverwind.applications;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.solventek.silverwind.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "application_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class ApplicationDocuments extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    @JsonIgnore // Prevent circular reference when serializing
    private JobApplication application;

    @Column(nullable = false)
    private String category; // e.g., "RESUME", "COVER_LETTER", "CERTIFICATION", "ONBOARDING"

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String filePath; // Stored path

    private String uploadedBy; // User ID or Name

    private LocalDateTime uploadedAt;

    @PrePersist
    public void prePersist() {
        if (uploadedAt == null)
            uploadedAt = LocalDateTime.now();
    }

    public String getFilePath() {
        return this.filePath;
    }

    public String getFileName() {
        return this.fileName;
    }
}
