package com.solventek.silverwind.ticket.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class TicketCommentResponse {
    private UUID id;
    private UUID ticketId;
    private String message;
    private TicketResponse.EmployeeSummary sender;
    private Instant sentAt;
}
