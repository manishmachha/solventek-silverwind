package com.solventek.silverwind.org;

import com.solventek.silverwind.auth.EmployeeRepository;

import com.solventek.silverwind.dto.DashboardStatsDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final EmployeeRepository employeeRepository;
    private final AssetRepository assetRepository;
    private final com.solventek.silverwind.projects.ProjectRepository projectRepository;
    private final com.solventek.silverwind.jobs.JobRepository jobRepository;
    private final com.solventek.silverwind.applications.JobApplicationRepository jobApplicationRepository;
    private final com.solventek.silverwind.feature.leave.repository.LeaveRequestRepository leaveRequestRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(readOnly = true)
    public DashboardStatsDTO getAdminDashboardStats(java.util.UUID organizationId) {

        // 1. Top Level Stats (Org Scoped)
        long activeJobs = jobRepository.countByOrganizationIdAndStatus(organizationId,
                com.solventek.silverwind.jobs.JobStatus.PUBLISHED);
        long totalEmployees = employeeRepository.countByOrganizationId(organizationId);
        long totalApplications = jobApplicationRepository.countByJob_Organization_Id(organizationId);
        long pendingApprovals = leaveRequestRepository.countByOrganizationIdAndStatus(organizationId,
                com.solventek.silverwind.feature.leave.entity.LeaveStatus.PENDING);

        // 2. Employees by Department
        List<Object[]> userDepts = employeeRepository.countByOrganizationIdGroupedByDepartment(organizationId);
        List<DashboardStatsDTO.ChartData> empByDept = mapToChartData(userDepts);

        // 3. Projects by Status
        List<Object[]> projStatus = projectRepository.countByInternalOrgIdGroupedByStatus(organizationId);
        List<DashboardStatsDTO.ChartData> projByStatus = mapToChartData(projStatus);

        // 4. Assets by Type
        // Similar assumption for AssetRepository
        List<DashboardStatsDTO.ChartData> assetsByType = new ArrayList<>();

        // 5. Employee Status
        List<Object[]> empStatus = employeeRepository.countByOrganizationIdGroupedByStatus(organizationId);
        List<DashboardStatsDTO.ChartData> empStatusDist = mapToChartData(empStatus);

        // 6. Recruitment Pipeline
        List<Object[]> appStatus = jobApplicationRepository.countByJob_Organization_IdGroupedByStatus(organizationId);
        List<DashboardStatsDTO.ChartData> recruitmentPipeline = mapToChartData(appStatus);

        // 7. Projects by Client
        List<DashboardStatsDTO.ChartData> projByClient = new ArrayList<>();

        return DashboardStatsDTO.builder()
                .employeesByDepartment(empByDept)
                .projectsByStatus(projByStatus)
                .assetsByType(assetsByType)
                .employeeStatusDistribution(empStatusDist)
                .projectsByClient(projByClient)
                .recruitmentPipeline(recruitmentPipeline)
                .totalActiveJobs(activeJobs)
                .totalEmployees(totalEmployees)
                .totalApplications(totalApplications)
                .pendingApprovals(pendingApprovals)
                .build();
    }

    private List<DashboardStatsDTO.ChartData> mapToChartData(List<Object[]> data) {
        return data.stream()
                .map(obj -> new DashboardStatsDTO.ChartData(
                        obj[0] == null ? "Unknown" : obj[0].toString(),
                        ((Number) obj[1]).longValue()))
                .collect(Collectors.toList());
    }
}
