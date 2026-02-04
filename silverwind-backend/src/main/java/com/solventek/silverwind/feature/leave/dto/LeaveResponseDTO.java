package com.solventek.silverwind.feature.leave.dto;

import com.solventek.silverwind.feature.leave.entity.LeaveStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class LeaveResponseDTO {
    private UUID id;
    private UUID userId;
    private String userName;
    private String leaveTypeName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
    private LeaveStatus status;
    private String rejectionReason;
    private String approverName;
    private LocalDateTime createdAt;
}
