package com.solventek.silverwind.ticket.dto;

import com.solventek.silverwind.ticket.TicketStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class TicketHistoryResponse {
    private UUID id;
    private TicketStatus oldStatus;
    private TicketStatus newStatus;
    private TicketResponse.EmployeeSummary changedBy;
    private Instant changedAt;
}
