package com.solventek.silverwind.feature.leave.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class LeaveRequestDTO {
    private UUID leaveTypeId;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
}
