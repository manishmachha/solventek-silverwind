package com.solventek.silverwind.ticket.dto;

import com.solventek.silverwind.ticket.TicketPriority;
import com.solventek.silverwind.ticket.TicketStatus;
import com.solventek.silverwind.ticket.TicketType;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class TicketResponse {
    private UUID id;
    private String ticketNumber;
    private String subject;
    private String description;
    private TicketType type;
    private TicketStatus status;
    private TicketPriority priority;

    private OrganizationSummary targetOrganization;

    private EmployeeSummary employee;
    private EmployeeSummary assignedTo;

    private boolean isEscalated;
    private Instant createdAt;
    private Instant updatedAt;

    private int unreadCountForEmployee;
    private int unreadCountForAdmin;

    @Data
    @Builder
    public static class EmployeeSummary {
        private UUID id;
        private String firstName;
        private String lastName;
        private String email;
        private String profilePhotoUrl;
    }

    @Data
    @Builder
    public static class OrganizationSummary {
        private UUID id;
        private String name;
        private String type; // OrganizationType enum name
    }
}
