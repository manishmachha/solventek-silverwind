package com.solventek.silverwind.client.submission;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "client_submission_comments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class ClientSubmissionComment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_submission_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "comments" }) // Prevent infinite recursion if we add
                                                                                 // list to parent
    private ClientSubmission clientSubmission;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String commentText;

    @ManyToOne(fetch = FetchType.EAGER) // Eager to show author name immediately
    @JoinColumn(name = "author_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "passwordHash", "directReports", "documents" })
    private Employee author;

    // BaseEntity handles id, createdAt, updatedAt
}
