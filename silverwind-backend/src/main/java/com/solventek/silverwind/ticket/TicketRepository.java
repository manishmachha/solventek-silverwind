package com.solventek.silverwind.ticket;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    List<Ticket> findByEmployeeId(UUID employeeId);

    List<Ticket> findByEmployeeIdOrAssignedToId(UUID employeeId, UUID assignedToId);

    // Convert to query to avoid property traversal issues if needed, but standard
    // naming works
    List<Ticket> findByTargetOrganizationId(UUID targetOrgId);

    List<Ticket> findByAssignedToId(UUID assigneeId);

    List<Ticket> findByStatus(TicketStatus status);

    Optional<Ticket> findByTicketNumber(String ticketNumber);

    List<Ticket> findByEmployeeIdAndStatus(UUID employeeId, TicketStatus status);

    @Query("SELECT t FROM Ticket t WHERE lower(t.subject) LIKE lower(concat('%', :query, '%'))")
    List<Ticket> searchBySubject(@Param("query") String query);

    List<Ticket> findByPriority(TicketPriority priority);
}
