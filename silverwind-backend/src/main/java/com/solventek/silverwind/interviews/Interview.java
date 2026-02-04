package com.solventek.silverwind.interviews;

import com.solventek.silverwind.applications.JobApplication;
import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "interviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Interview extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private JobApplication application;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interviewer_id", nullable = false)
    private Employee interviewer;

    @Column(nullable = false)
    private LocalDateTime scheduledAt;

    @Column(nullable = false)
    private Integer durationMinutes; // e.g., 30, 45, 60

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InterviewType type; // TECHNICAL, HR, CLIENT

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InterviewStatus status; // SCHEDULED, COMPLETED, CANCELLED, NO_SHOW

    @Column(columnDefinition = "text")
    private String meetingLink;

    @Column(columnDefinition = "text")
    private String feedback;

    private Integer rating; // 1-5
}
