package com.solventek.silverwind.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private List<ChartData> employeesByDepartment;
    private List<ChartData> projectsByStatus;
    private List<ChartData> assetsByType;
    private List<ChartData> employeeStatusDistribution;
    private List<ChartData> projectsByClient;
    private List<ChartData> recruitmentPipeline;

    // Top Level Stats
    private long totalActiveJobs;
    private long totalEmployees;
    private long totalApplications;
    private long pendingApprovals;

    @Data
    @AllArgsConstructor
    public static class ChartData {
        private String label;
        private Long value;
    }
}
