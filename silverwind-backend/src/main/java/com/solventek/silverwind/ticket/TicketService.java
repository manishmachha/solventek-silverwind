package com.solventek.silverwind.ticket;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.auth.EmployeeRepository;
import com.solventek.silverwind.notifications.Notification.NotificationCategory;
import com.solventek.silverwind.notifications.Notification.NotificationPriority;
import com.solventek.silverwind.notifications.NotificationService;
import com.solventek.silverwind.notifications.NotificationService.NotificationBuilder;
import com.solventek.silverwind.org.Organization;
import com.solventek.silverwind.org.OrganizationRepository;
import com.solventek.silverwind.timeline.TimelineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;
    private final EmployeeRepository employeeRepository;
    private final TicketHistoryRepository ticketHistoryRepository;
    private final TicketCommentRepository ticketCommentRepository;
    private final OrganizationRepository organizationRepository;
    private final NotificationService notificationService;
    private final TimelineService timelineService;

    // A simple counter for ticket IDs, in production this should be a DB sequence
    private static final AtomicLong TICKET_COUNTER = new AtomicLong(System.currentTimeMillis() % 100000);

    public List<Ticket> getMyTickets(UUID employeeId) {
        log.debug("Fetching tickets for Employee ID: {}", employeeId);
        return ticketRepository.findByEmployeeIdOrAssignedToId(employeeId, employeeId);
    }

    public List<Ticket> getAllTickets(UUID requesterId) {
        log.debug("Fetching all tickets for Requester ID: {}", requesterId);
        Employee requester = employeeRepository.findById(requesterId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Rules:
        // SUPER_ADMIN: Can see ALL tickets (or filter by specific org if needed, but
        // 'all' means all)
        // HR_ADMIN / ADMIN: Can see tickets addressed to THEIR Organization.
        // OTHERS: Should only use getMyTickets.

        if ("SUPER_ADMIN".equals(requester.getRole().getName())) {
            return ticketRepository.findAll();
        } else if ("ADMIN".equals(requester.getRole().getName()) || "HR_ADMIN".equals(requester.getRole().getName())) {
            return ticketRepository.findByTargetOrganizationId(requester.getOrganization().getId());
        } else {
            // Fallback for unauthorized access to "all" endpoint
            log.warn("Unauthorized access attempt to getAllTickets by user: {}", requesterId);
            return ticketRepository.findByEmployeeId(requesterId);
        }
    }

    public Ticket getTicketById(UUID id) {
        log.debug("Fetching Ticket ID: {}", id);
        return ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
    }

    public List<TicketHistory> getTicketHistory(UUID ticketId) {
        log.debug("Fetching history for Ticket ID: {}", ticketId);
        return ticketHistoryRepository.findByTicketIdOrderByChangedAtAsc(ticketId);
    }

    public List<TicketComment> getTicketComments(UUID ticketId) {
        log.debug("Fetching comments for Ticket ID: {}", ticketId);
        return ticketCommentRepository.findByTicketIdOrderBySentAtAsc(ticketId);
    }

    @Transactional
    public Ticket createTicket(UUID userId, String subject, String description, TicketType type,
            TicketPriority priority, UUID targetOrgId, UUID assignedToUserId) {
        log.info("Creating ticket '{}' for user {}", subject, userId);
        try {
            Employee employee = employeeRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Organization targetOrg;

            // Logic:
            // SUPER_ADMIN / HR_ADMIN: Can specify ANY targetOrg (if passed).
            // If they don't specify, default to their own.
            // OTHERS: Must stick to their own org.

            if (targetOrgId != null) {
                boolean isSameOrg = targetOrgId.equals(employee.getOrganization().getId());
                boolean hasPrivilege = "SUPER_ADMIN".equals(employee.getRole().getName()) ||
                        "HR_ADMIN".equals(employee.getRole().getName());

                if (!isSameOrg && !hasPrivilege) {
                    log.warn("Ticket creation denied: User {} tried to create ticket for another org {}", userId,
                            targetOrgId);
                    throw new AccessDeniedException(
                            "You do not have permission to assign tickets to other organizations.");
                }

                targetOrg = organizationRepository.findById(targetOrgId)
                        .orElseThrow(() -> new RuntimeException("Target Organization not found"));
            } else {
                targetOrg = employee.getOrganization();
            }

            Employee assignedToUser = null;
            if (assignedToUserId != null) {
                assignedToUser = employeeRepository.findById(assignedToUserId)
                        .orElseThrow(() -> new RuntimeException("Assigned User not found"));

                if (!assignedToUser.getOrganization().getId().equals(targetOrg.getId())) {
                    throw new IllegalArgumentException("Assigned user does not belong to the target organization");
                }
            }

            Ticket ticket = Ticket.builder()
                    .ticketNumber("TKT-" + TICKET_COUNTER.incrementAndGet())
                    .subject(subject)
                    .description(description)
                    .type(type)
                    .priority(priority)
                    .employee(employee)
                    .targetOrganization(targetOrg)
                    .assignedTo(assignedToUser)
                    .status(TicketStatus.OPEN)
                    .isEscalated(false)
                    .unreadCountForEmployee(0)
                    .unreadCountForAdmin(1) // New ticket is unread for Admin
                    .build();

            Ticket savedTicket = ticketRepository.save(ticket);

            // Initial history
            saveHistory(savedTicket, null, TicketStatus.OPEN, employee);

            // Notify target organization admins about new ticket
            try {
                List<Employee> targetAdmins = employeeRepository.findByOrganizationId(targetOrg.getId());
                for (Employee admin : targetAdmins) {
                    if (!admin.getId().equals(userId)) { // Don't notify self
                        notificationService.sendNotification(
                                NotificationBuilder.create()
                                        .recipient(admin.getId())
                                        .title("🎫 New Support Ticket")
                                        .body(employee.getFirstName() + " " + employee.getLastName()
                                                + " raised ticket: "
                                                + subject + " (" + priority.name() + " priority)")
                                        .category(NotificationCategory.TICKET)
                                        .priority(priority == TicketPriority.CRITICAL ? NotificationPriority.URGENT
                                                : priority == TicketPriority.HIGH ? NotificationPriority.HIGH
                                                        : NotificationPriority.NORMAL)
                                        .refEntity("TICKET", savedTicket.getId())
                                        .actionUrl("/portal/tickets/" + savedTicket.getId())
                                        .icon("bi-ticket-detailed")
                                        .withMetadata("ticketNumber", savedTicket.getTicketNumber())
                                        .withMetadata("priority", priority.name()));
                    }
                }
            } catch (Exception e) {
                log.error("Error sending notification for new ticket {}", savedTicket.getTicketNumber(), e);
            }

            log.info("Ticket created successfully: {}", savedTicket.getTicketNumber());

            // Audit
            timelineService.createEvent(targetOrg.getId(), "TICKET", savedTicket.getId(), "CREATE",
                    "Ticket Created", userId, assignedToUserId, // assignedTo is target if present, else null? Or
                                                                // employee?
                    // If employee created it, they are actor. Target could be Organization or
                    // Assigned Agent.
                    // If Admin created it for employee (rare?), employee is target.
                    // Let's use `assignedToUserId` or null.
                    "Ticket " + savedTicket.getTicketNumber() + " created: " + subject, null);

            return savedTicket;
        } catch (Exception e) {
            log.error("Error creating ticket for user {}: {}", userId, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public Ticket updateTicketStatus(UUID ticketId, TicketStatus newStatus, UUID changedByEmployeeId) {
        Ticket ticket = getTicketById(ticketId);
        TicketStatus oldStatus = ticket.getStatus();

        if (oldStatus != newStatus) {
            ticket.setStatus(newStatus);
            // Status change is relevant to Employee (if changed by Admin)
            // OR Admin (if changed by Employee - though employees usually don't change
            // status except to close/reopen)

            // Logic: If changed by someone other than the owner, increment owner's unread
            // count
            if (!ticket.getEmployee().getId().equals(changedByEmployeeId)) {
                ticket.setUnreadCountForEmployee(ticket.getUnreadCountForEmployee() + 1);
            } else {
                ticket.setUnreadCountForAdmin(ticket.getUnreadCountForAdmin() + 1);
            }

            Ticket savedTicket = ticketRepository.save(ticket);

            Employee changedBy = employeeRepository.findById(changedByEmployeeId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            saveHistory(savedTicket, oldStatus, newStatus, changedBy);

            // Notify affected party about status change
            try {
                UUID notifyUserId = !ticket.getEmployee().getId().equals(changedByEmployeeId)
                        ? ticket.getEmployee().getId()
                        : (ticket.getAssignedTo() != null ? ticket.getAssignedTo().getId() : null);

                if (notifyUserId != null) {
                    String statusEmoji = newStatus == TicketStatus.RESOLVED ? "✅"
                            : newStatus == TicketStatus.IN_PROGRESS ? "⚡"
                                    : newStatus == TicketStatus.CLOSED ? "🔒" : "🔄";

                    notificationService.sendNotification(
                            NotificationBuilder.create()
                                    .recipient(notifyUserId)
                                    .title(statusEmoji + " Ticket Status Updated")
                                    .body("Ticket " + ticket.getTicketNumber() + " changed from "
                                            + oldStatus.name() + " to " + newStatus.name())
                                    .category(NotificationCategory.TICKET)
                                    .priority(newStatus == TicketStatus.RESOLVED ? NotificationPriority.HIGH
                                            : NotificationPriority.NORMAL)
                                    .refEntity("TICKET", ticket.getId())
                                    .actionUrl("/portal/tickets/" + ticket.getId())
                                    .icon("bi-arrow-repeat")
                                    .withMetadata("oldStatus", oldStatus.name())
                                    .withMetadata("newStatus", newStatus.name()));
                }
            } catch (Exception e) {
                log.error("Error sending notification for ticket status change {}", ticket.getTicketNumber(), e);
            }
            log.info("Ticket {} status updated to {}", ticketId, newStatus);

            // Audit
            timelineService.createEvent(ticket.getTargetOrganization().getId(), "TICKET", ticket.getId(),
                    "STATUS_CHANGE",
                    "Ticket Status Updated", changedByEmployeeId, ticket.getEmployee().getId(),
                    "Status changed to " + newStatus, null);

            return savedTicket;
        }
        return ticket;
    }

    @Transactional
    public Ticket escalateTicket(UUID ticketId, UUID requestedByEmployeeId) {
        Ticket ticket = getTicketById(ticketId);
        if (!ticket.isEscalated()) {
            log.info("Escalating ticket: {}", ticketId);
            ticket.setEscalated(true);
            ticket.setPriority(TicketPriority.CRITICAL); // Escalation implies high/critical

            // Notify Admin
            ticket.setUnreadCountForAdmin(ticket.getUnreadCountForAdmin() + 1);

            Ticket saved = ticketRepository.save(ticket);
            log.info("Ticket escalated successfully: {}", ticketId);

            timelineService.createEvent(ticket.getTargetOrganization().getId(), "TICKET", ticket.getId(), "ESCALATE",
                    "Ticket Escalated", requestedByEmployeeId, ticket.getEmployee().getId(),
                    "Ticket escalated to CRITICAL", null);

            // Notify Target Org Admins
            try {
                employeeRepository.findByOrganizationId(ticket.getTargetOrganization().getId()).forEach(admin -> {
                     notificationService.sendNotification(
                            NotificationBuilder.create()
                                    .recipient(admin.getId())
                                    .title("⚠️ Ticket Escalated")
                                    .body("Ticket " + ticket.getTicketNumber() + " has been ESCALATED to CRITICAL priority.")
                                    .category(NotificationCategory.TICKET)
                                    .priority(NotificationPriority.URGENT)
                                    .refEntity("TICKET", ticket.getId())
                                    .actionUrl("/portal/tickets/" + ticket.getId())
                                    .icon("bi-exclamation-triangle-fill"));
                });
            } catch (Exception e) {
                log.error("Error sending notification for escalated ticket {}", ticket.getTicketNumber(), e);
            }

            return saved;
        }
        return ticket;
    }

    @Transactional
    public TicketComment addComment(UUID ticketId, UUID senderId, String message) {
        log.info("Adding comment to Ticket ID: {} by Sender ID: {}", ticketId, senderId);
        Ticket ticket = getTicketById(ticketId);
        Employee sender = employeeRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TicketComment comment = TicketComment.builder()
                .ticket(ticket)
                .sender(sender)
                .message(message)
                .build();

        // Increment unread count for the "other" party
        boolean isSenderEmployee = sender.getId().equals(ticket.getEmployee().getId());

        if (isSenderEmployee) {
            ticket.setUnreadCountForAdmin(ticket.getUnreadCountForAdmin() + 1);
        } else {
            ticket.setUnreadCountForEmployee(ticket.getUnreadCountForEmployee() + 1);
        }
        ticketRepository.save(ticket);

        TicketComment savedComment = ticketCommentRepository.save(comment);

        // Notify the other party about new comment
        try {
            UUID notifyUserId = isSenderEmployee
                    ? (ticket.getAssignedTo() != null ? ticket.getAssignedTo().getId() : null)
                    : ticket.getEmployee().getId();

            if (notifyUserId != null) {
                notificationService.sendNotification(
                        NotificationBuilder.create()
                                .recipient(notifyUserId)
                                .title("💬 New Ticket Reply")
                                .body(sender.getFirstName() + " replied to " + ticket.getTicketNumber()
                                        + ": \"" + (message.length() > 50 ? message.substring(0, 50) + "..." : message)
                                        + "\"")
                                .category(NotificationCategory.TICKET)
                                .priority(NotificationPriority.NORMAL)
                                .refEntity("TICKET", ticket.getId())
                                .actionUrl("/portal/tickets/" + ticket.getId())
                                .icon("bi-chat-dots"));
            }
        } catch (Exception e) {
            log.error("Error sending notification for new ticket comment on {}", ticket.getTicketNumber(), e);
        }

        // Audit
        timelineService.createEvent(ticket.getTargetOrganization().getId(), "TICKET", ticket.getId(), "COMMENT",
                "New Comment", senderId, ticket.getEmployee().getId(), // Target is ticket owner usually
                "Comment added: " + (message.length() > 20 ? message.substring(0, 20) + "..." : message), null);

        return savedComment;
    }

    @Transactional
    public void markAsRead(UUID ticketId, UUID readingEmployeeId) {
        log.debug("Marking ticket {} as read by {}", ticketId, readingEmployeeId);
        Ticket ticket = getTicketById(ticketId);

        // Determine role and reset counter
        // If the reader is the ticket owner (Employee)
        if (ticket.getEmployee().getId().equals(readingEmployeeId)) {
            ticket.setUnreadCountForEmployee(0);
        } else {
            // Assume reader is HR/Admin handling the ticket
            ticket.setUnreadCountForAdmin(0);
        }
        ticketRepository.save(ticket);
    }

    private void saveHistory(Ticket ticket, TicketStatus oldStatus, TicketStatus newStatus, Employee changedBy) {
        log.trace("Saving history for Ticket ID: {} ({} -> {})", ticket.getId(), oldStatus, newStatus);
        TicketHistory history = TicketHistory.builder()
                .ticket(ticket)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .changedBy(changedBy)
                .build();
        ticketHistoryRepository.save(history);
    }
}
