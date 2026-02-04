package com.solventek.silverwind.feature.leave.dto;

import com.solventek.silverwind.feature.leave.entity.LeaveStatus;
import lombok.Data;

import java.util.UUID;

@Data
public class LeaveActionDTO {
    private UUID leaveRequestId;
    private LeaveStatus status; // APPROVED or REJECTED
    private String rejectionReason;
}
