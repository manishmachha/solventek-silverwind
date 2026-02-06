package com.solventek.silverwind.ticket;

import com.solventek.silverwind.auth.Employee;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.solventek.silverwind.org.Organization;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tickets")
public class Ticket {

    @Id
    @UuidGenerator
    @Column(nullable = false, updatable = false)
    private UUID id;

    @NotNull
    @Column(nullable = false, unique = true)
    private String ticketNumber; // E.g., TKT-1001

    @NotBlank
    @Size(max = 255)
    @Column(nullable = false)
    private String subject;

    @NotBlank
    @Size(max = 4096)
    @Column(nullable = false, length = 4096)
    private String description; // Increased length for detailed issues

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketType type;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketStatus status;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketPriority priority;

    // The organization this ticket is addressed to
    // For internal tickets, this is the employee's own org.
    // For SuperAdmin/HR assigning to Vendor/Client, this is the target org.
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_org_id", nullable = false)
    private Organization targetOrganization;

    // Requester (The employee/user who raised the ticket)
    @NotNull
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    // Assignee (HR/Admin/Manager handling the ticket)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_to_id")
    private Employee assignedTo;

    // Optional: Link to related entity if needed (e.g. Timesheet ID)
    @Column(name = "related_entity_id")
    private UUID relatedEntityId;

    @Builder.Default
    @Column(name = "is_escalated", nullable = false)
    private boolean isEscalated = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Builder.Default
    @Column(name = "unread_count_employee", nullable = false, columnDefinition = "integer default 0")
    private int unreadCountForEmployee = 0;

    @Builder.Default
    @Column(name = "unread_count_admin", nullable = false, columnDefinition = "integer default 0")
    private int unreadCountForAdmin = 0;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<TicketComment> comments;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<TicketHistory> history;
}
