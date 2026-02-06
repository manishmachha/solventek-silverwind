package com.solventek.silverwind.feature.leave.service;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.auth.EmployeeRepository;
import com.solventek.silverwind.feature.leave.dto.LeaveActionDTO;
import com.solventek.silverwind.feature.leave.dto.LeaveBalanceDTO;
import com.solventek.silverwind.feature.leave.dto.LeaveRequestDTO;
import com.solventek.silverwind.feature.leave.dto.LeaveResponseDTO;
import com.solventek.silverwind.feature.leave.dto.LeaveTypeDTO;
import com.solventek.silverwind.feature.leave.entity.*;
import com.solventek.silverwind.feature.leave.repository.LeaveBalanceRepository;
import com.solventek.silverwind.feature.leave.repository.LeaveRequestRepository;
import com.solventek.silverwind.feature.leave.repository.LeaveTypeRepository;
import com.solventek.silverwind.notifications.Notification.NotificationCategory;
import com.solventek.silverwind.notifications.Notification.NotificationPriority;
import com.solventek.silverwind.notifications.NotificationService;
import com.solventek.silverwind.timeline.TimelineService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;

import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaveOperationService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final EmployeeRepository employeeRepository;
    private final NotificationService notificationService;
    private final TimelineService timelineService;

    @Transactional
    public void submitLeaveRequest(UUID userId, LeaveRequestDTO dto) {
        Employee employee = employeeRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        LeaveType leaveType = leaveTypeRepository.findById(dto.getLeaveTypeId())
                .orElseThrow(() -> new RuntimeException("Leave Type not found"));

        // Ensure Leave Type belongs to User's Org
        if (!leaveType.getOrganizationId().equals(employee.getOrganization().getId())) {
            throw new RuntimeException("Leave Type does not belong to user's organization");
        }

        long daysRequested = ChronoUnit.DAYS.between(dto.getStartDate(), dto.getEndDate()) + 1;
        if (daysRequested <= 0) {
            throw new RuntimeException("Invalid Date Range");
        }

        // Policy Checks
        if (leaveType.getMaxConsecutiveDays() != null && daysRequested > leaveType.getMaxConsecutiveDays()) {
            throw new RuntimeException(
                    "Exceeds maximum consecutive days allowed (" + leaveType.getMaxConsecutiveDays() + ")");
        }

        // Check Balance
        int year = dto.getStartDate().getYear();
        LeaveBalance balance = getOrCreateBalance(employee, leaveType, year);

        if (balance.getRemainingDays() < daysRequested) {
            throw new RuntimeException("Insufficient Leave Balance");
        }

        LeaveRequest request = LeaveRequest.builder()
                .employee(employee)
                .leaveType(leaveType)
                .organizationId(employee.getOrganization().getId())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .reason(dto.getReason())
                .status(LeaveStatus.PENDING)
                .build();

        leaveRequestRepository.save(request);

        // Notify Manager or Fallback to Org Admins
        String title = "New Leave Request";
        String body = employee.getFirstName() + " " + employee.getLastName() + " has requested leave for "
                + leaveType.getName();
        String actionUrl = "/admin/leave-management";
        String icon = "bi-calendar-plus";

        if (employee.getManager() != null) {
            notificationService.sendNotification(NotificationService.NotificationBuilder.create()
                    .recipient(employee.getManager().getId())
                    .title(title)
                    .body(body)
                    .category(NotificationCategory.LEAVE)
                    .refEntity("LEAVE", request.getId())
                    .actionUrl(actionUrl)
                    .icon(icon)
                    .priority(NotificationPriority.NORMAL));
        } else {
            // Fallback: Notify all Org Admins
            notificationService.sendNotificationToOrgAdmins(employee.getOrganization().getId(), title, body, "LEAVE",
                    request.getId());
        }

        // Create Timeline Event
        timelineService.createEvent(employee.getOrganization().getId(), "LEAVE", request.getId(), "LEAVE_REQUESTED",
                "Leave Requested", employee.getId(), employee.getId(),
                "Requested leave for " + leaveType.getName(), null);
    }

    @Transactional
    public void takeAction(UUID adminId, LeaveActionDTO dto) {
        Employee admin = employeeRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        LeaveRequest request = leaveRequestRepository.findById(dto.getLeaveRequestId())
                .orElseThrow(() -> new RuntimeException("Request not found"));

        // Admin Isolation Check
        if (!request.getOrganizationId().equals(admin.getOrganization().getId())) {
            throw new RuntimeException("Access Denied: Request belongs to another organization");
        }

        if (request.getStatus() != LeaveStatus.PENDING) {
            throw new RuntimeException("Request is not pending");
        }

        if (dto.getStatus() == LeaveStatus.APPROVED) {
            long days = ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate()) + 1;
            LeaveBalance balance = getOrCreateBalance(request.getEmployee(), request.getLeaveType(),
                    request.getStartDate().getYear());

            if (balance.getRemainingDays() < days) {
                // Edge case: balance changed since application
                request.setStatus(LeaveStatus.REJECTED);
                request.setRejectionReason("System Auto-Reject: Insufficient Balance at approval time");
            } else {
                balance.setUsedDays(balance.getUsedDays() + days);
                balance.setRemainingDays(balance.getRemainingDays() - days);
                leaveBalanceRepository.save(balance);
                request.setStatus(LeaveStatus.APPROVED);
            }
        } else {
            request.setStatus(LeaveStatus.REJECTED);
            request.setRejectionReason(dto.getRejectionReason());
        }

        request.setApprover(admin);
        leaveRequestRepository.save(request);

        // Notify User
        boolean isApproved = (request.getStatus() == LeaveStatus.APPROVED);
        String title = "Leave Request " + (isApproved ? "Approved" : "Rejected");
        String message = "Your leave request for " + request.getLeaveType().getName() + " has been "
                + request.getStatus().toString().toLowerCase() + ".";
        String icon = isApproved ? "bi-check-circle-fill" : "bi-x-circle-fill";
        // String colorClass = isApproved ? "text-green-600" : "text-red-600"; // Can be added to metadata

        notificationService.sendNotification(NotificationService.NotificationBuilder.create()
                .recipient(request.getEmployee().getId())
                .title(title)
                .body(message)
                .category(NotificationCategory.LEAVE)
                .refEntity("LEAVE", request.getId())
                .actionUrl("/my-leaves")
                .icon(icon)
                .priority(NotificationPriority.HIGH));

        // Create Timeline Event
        timelineService.createEvent(request.getOrganizationId(), "LEAVE", request.getId(),
                "LEAVE_" + dto.getStatus().name(),
                title, admin.getId(), request.getEmployee().getId(),
                message, null);
    }

    public List<LeaveResponseDTO> getMyRequests(UUID userId) {
        return leaveRequestRepository.findByEmployeeIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<LeaveResponseDTO> getPendingRequests(UUID organizationId) {
        // Only return pending requests for the admin's organization
        return leaveRequestRepository.findAllPendingByOrganizationId(organizationId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<LeaveBalanceDTO> getMyBalances(UUID userId, int year) {
        Employee employee = employeeRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Fetch LeaveTypes ONLY for this user's organization
        List<LeaveType> allTypes = leaveTypeRepository.findAllByOrganizationId(employee.getOrganization().getId());

        return allTypes.stream()
                .map(type -> {
                    if (type.isActive()) {
                        return mapToBalanceDTO(getOrCreateBalance(employee, type, year));
                    }
                    return null;
                })
                .filter(dto -> dto != null)
                .collect(Collectors.toList());
    }

    public Page<LeaveResponseDTO> getAllRequests(String search, LeaveStatus status,
            UUID leaveTypeId, LocalDate startDate, LocalDate endDate,
            UUID organizationId,
            Pageable pageable) {
        Specification<LeaveRequest> spec = createSpecification(search, status,
                leaveTypeId, startDate, endDate, organizationId);
        return leaveRequestRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    public List<LeaveTypeDTO> getActiveLeaveTypes(UUID organizationId) {
        return leaveTypeRepository.findAllByOrganizationId(organizationId).stream()
                .filter(LeaveType::isActive)
                .map(this::mapToTypeDTO)
                .collect(Collectors.toList());
    }

    private LeaveTypeDTO mapToTypeDTO(LeaveType entity) {
        LeaveTypeDTO dto = new LeaveTypeDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setDefaultDaysPerYear(entity.getDefaultDaysPerYear());
        dto.setCarryForwardAllowed(entity.isCarryForwardAllowed());
        dto.setActive(entity.isActive());
        dto.setAccrualFrequency(
                entity.getAccrualFrequency() != null ? entity.getAccrualFrequency().name() : "ANNUALLY");
        dto.setMaxDaysPerMonth(entity.getMaxDaysPerMonth());
        dto.setMaxConsecutiveDays(entity.getMaxConsecutiveDays());
        dto.setRequiresApproval(entity.isRequiresApproval());
        return dto;
    }

    private LeaveBalanceDTO mapToBalanceDTO(LeaveBalance entity) {
        return LeaveBalanceDTO.builder()
                .id(entity.getId())
                .leaveTypeName(entity.getLeaveType().getName())
                .allocatedDays(entity.getAllocatedDays())
                .usedDays(entity.getUsedDays())
                .remainingDays(entity.getRemainingDays())
                .build();
    }

    private LeaveBalance getOrCreateBalance(Employee employee, LeaveType leaveType, int year) {
        return leaveBalanceRepository.findByEmployeeIdAndYearAndLeaveType(employee.getId(), year, leaveType)
                .orElseGet(() -> {
                    LeaveBalance newBalance = new LeaveBalance();
                    newBalance.setEmployee(employee);
                    newBalance.setLeaveType(leaveType);
                    newBalance.setYear(year);
                    newBalance.setAllocatedDays(leaveType.getDefaultDaysPerYear());
                    newBalance.setUsedDays(0);
                    newBalance.setRemainingDays(leaveType.getDefaultDaysPerYear());
                    return leaveBalanceRepository.save(newBalance);
                });
    }

    private LeaveResponseDTO mapToResponse(LeaveRequest entity) {
        return LeaveResponseDTO.builder()
                .id(entity.getId())
                .userId(entity.getEmployee().getId())
                .userName(entity.getEmployee().getFirstName() + " " + entity.getEmployee().getLastName())
                .leaveTypeName(entity.getLeaveType().getName())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .reason(entity.getReason())
                .status(entity.getStatus())
                .rejectionReason(entity.getRejectionReason())
                .approverName(entity.getApprover() != null ? entity.getApprover().getFirstName() : null)
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private Specification<LeaveRequest> createSpecification(String searchQuery,
            LeaveStatus status,
            UUID leaveTypeId, LocalDate startDate, LocalDate endDate, UUID organizationId) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // ORGANIZATION FILTER
            predicates.add(criteriaBuilder.equal(root.get("organizationId"), organizationId));

            if (searchQuery != null && !searchQuery.isEmpty()) {
                String likePattern = "%" + searchQuery.toLowerCase() + "%";
                Predicate firstNameMatch = criteriaBuilder
                        .like(criteriaBuilder.lower(root.get("employee").get("firstName")), likePattern);
                Predicate lastNameMatch = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("employee").get("lastName")),
                        likePattern);
                predicates.add(criteriaBuilder.or(firstNameMatch, lastNameMatch));
            }

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            if (leaveTypeId != null) {
                predicates.add(criteriaBuilder.equal(root.get("leaveType").get("id"), leaveTypeId));
            }

            if (startDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("endDate"), startDate));
            }
            if (endDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("startDate"), endDate));
            }

            query.orderBy(criteriaBuilder.desc(root.get("createdAt")));

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
