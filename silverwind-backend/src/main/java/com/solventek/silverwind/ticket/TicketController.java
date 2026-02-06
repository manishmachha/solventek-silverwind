package com.solventek.silverwind.ticket;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.common.ApiResponse;
import com.solventek.silverwind.org.Organization;
import com.solventek.silverwind.security.UserPrincipal;
import com.solventek.silverwind.ticket.dto.TicketCommentResponse;
import com.solventek.silverwind.ticket.dto.TicketHistoryResponse;
import com.solventek.silverwind.ticket.dto.TicketResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Ticket management controller - Solventek employees only
 */
@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getMyTickets(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<Ticket> tickets = ticketService.getMyTickets(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(tickets.stream().map(this::mapToResponse).collect(Collectors.toList())));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getAllTickets(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<Ticket> tickets = ticketService.getAllTickets(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(tickets.stream().map(this::mapToResponse).collect(Collectors.toList())));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<TicketResponse>> getTicketById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(mapToResponse(ticketService.getTicketById(id))));
    }

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<TicketResponse>> createTicket(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody CreateTicketRequest request) {
        Ticket ticket = ticketService.createTicket(
                currentUser.getId(),
                request.subject,
                request.description,
                request.type,
                request.priority,
                request.targetOrgId,
                request.assignedToUserId);
        return ResponseEntity.ok(ApiResponse.success("Ticket created successfully.", mapToResponse(ticket)));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<TicketResponse>> updateStatus(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID id,
            @RequestBody UpdateStatusRequest request) {
        Ticket ticket = ticketService.updateTicketStatus(id, request.status, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Ticket status updated successfully.", mapToResponse(ticket)));
    }

    @PatchMapping("/{id}/escalate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<TicketResponse>> escalateTicket(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID id) {
        Ticket ticket = ticketService.escalateTicket(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Ticket escalated successfully.", mapToResponse(ticket)));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<TicketHistoryResponse>>> getHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(ticketService.getTicketHistory(id).stream()
                .map(this::mapToHistoryResponse)
                .collect(Collectors.toList())));
    }

    @GetMapping("/{id}/comments")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<TicketCommentResponse>>> getComments(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(ticketService.getTicketComments(id).stream()
                .map(this::mapToCommentResponse)
                .collect(Collectors.toList())));
    }

    @PostMapping("/{id}/comments")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<TicketCommentResponse>> addComment(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID id,
            @RequestBody AddCommentRequest request) {
        TicketComment comment = ticketService.addComment(id, currentUser.getId(), request.message);
        return ResponseEntity.ok(ApiResponse.success("Comment added successfully.", mapToCommentResponse(comment)));
    }

    @PostMapping("/{id}/mark-read")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID id) {
        ticketService.markAsRead(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Ticket marked as read.", null));
    }

    // DTO Mappers

    private TicketResponse mapToResponse(Ticket ticket) {
        return TicketResponse.builder()
                .id(ticket.getId())
                .ticketNumber(ticket.getTicketNumber())
                .subject(ticket.getSubject())
                .description(ticket.getDescription())
                .type(ticket.getType())
                .status(ticket.getStatus())
                .priority(ticket.getPriority())
                .targetOrganization(
                        ticket.getTargetOrganization() != null ? mapOrgSummary(ticket.getTargetOrganization()) : null)
                .employee(mapUserSummary(ticket.getEmployee()))
                .assignedTo(ticket.getAssignedTo() != null ? mapUserSummary(ticket.getAssignedTo()) : null)
                .isEscalated(ticket.isEscalated())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .unreadCountForEmployee(ticket.getUnreadCountForEmployee())
                .unreadCountForAdmin(ticket.getUnreadCountForAdmin())
                .build();
    }

    private TicketCommentResponse mapToCommentResponse(TicketComment comment) {
        return TicketCommentResponse.builder()
                .id(comment.getId())
                .ticketId(comment.getTicket().getId())
                .message(comment.getMessage())
                .sender(mapUserSummary(comment.getSender()))
                .sentAt(comment.getSentAt())
                .build();
    }

    private TicketHistoryResponse mapToHistoryResponse(TicketHistory history) {
        return TicketHistoryResponse.builder()
                .id(history.getId())
                .oldStatus(history.getOldStatus())
                .newStatus(history.getNewStatus())
                .changedBy(mapUserSummary(history.getChangedBy()))
                .changedAt(history.getChangedAt())
                .build();
    }

    private TicketResponse.EmployeeSummary mapUserSummary(Employee employee) {
        return TicketResponse.EmployeeSummary.builder()
                .id(employee.getId())
                .firstName(employee.getFirstName())
                .lastName(employee.getLastName())
                .email(employee.getEmail())
                .profilePhotoUrl(employee.getProfilePhotoUrl())
                .build();
    }

    private TicketResponse.OrganizationSummary mapOrgSummary(Organization org) {
        return TicketResponse.OrganizationSummary.builder()
                .id(org.getId())
                .name(org.getName())
                .type(org.getType().name())
                .build();
    }

    // Request DTOs
    public static class CreateTicketRequest {
        public String subject;
        public String description;
        public TicketType type;
        public TicketPriority priority;
        public UUID targetOrgId;
        public UUID assignedToUserId;
    }

    public static class UpdateStatusRequest {
        public TicketStatus status;
    }

    public static class AddCommentRequest {
        public String message;
    }
}
