package com.solventek.silverwind.feature.leave.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class LeaveBalanceDTO {
    private UUID id;
    private String leaveTypeName;
    private double allocatedDays;
    private double usedDays;
    private double remainingDays;
}
