package com.solventek.silverwind.feature.leave.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class LeaveTypeDTO {
    private UUID id;
    private String name;
    private String description;
    private int defaultDaysPerYear;
    private boolean carryForwardAllowed;
    private boolean isActive;

    // Policy Fields
    private String accrualFrequency; // MONTHLY, ANNUALLY, QUARTERLY
    private Integer maxDaysPerMonth;
    private Integer maxConsecutiveDays;
    private boolean requiresApproval;
}
