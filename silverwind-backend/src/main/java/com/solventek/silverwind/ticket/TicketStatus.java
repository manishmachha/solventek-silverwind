package com.solventek.silverwind.ticket;

/**
 * Status of a ticket in the system.
 * Includes states for waiting on external parties (Client, Vendor).
 */
public enum TicketStatus {
    OPEN,
    IN_PROGRESS,
    PENDING_APPROVAL,
    PENDING_VENDOR,
    PENDING_CLIENT,
    RESOLVED,
    CLOSED,
    REJECTED
}
