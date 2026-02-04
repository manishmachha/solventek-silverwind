package com.solventek.silverwind.org;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimesheetSummary {
    private UUID userId;
    private String userName;
    private LocalDate startDate;
    private LocalDate endDate;
    private double totalHours;
    private int daysPresent;
    private List<TimesheetEntry> entries;
}
