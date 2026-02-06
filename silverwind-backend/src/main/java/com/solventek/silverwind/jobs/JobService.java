package com.solventek.silverwind.jobs;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.auth.EmployeeRepository;
import com.solventek.silverwind.enums.EmploymentType;
import com.solventek.silverwind.notifications.NotificationService;
import com.solventek.silverwind.org.Organization;
import com.solventek.silverwind.org.OrganizationRepository;
import com.solventek.silverwind.org.OrganizationService;
import com.solventek.silverwind.org.OrganizationStatus;
import com.solventek.silverwind.org.OrganizationType;
import com.solventek.silverwind.rbac.Role;
import com.solventek.silverwind.timeline.TimelineService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobService {

    private final JobRepository jobRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationService organizationService;
    private final EmployeeRepository employeeRepository;
    private final TimelineService timelineService;
    private final NotificationService notificationService;

    private void validateAccess(Job job, UUID actorId) {
        log.trace("Validating access for Job ID: {} and Actor ID: {}", job.getId(), actorId);
        Employee actor = employeeRepository.findById(actorId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        // 1. Same Org Check
        boolean isSameOrg = actor.getOrganization().getId().equals(job.getOrganization().getId());

        // 2. Solventek Admin Override (Global Control)
        Role role = actor.getRole();
        boolean isGlobalAdmin = actor.getOrganization()
                .getType() == OrganizationType.SOLVENTEK &&
                role != null &&
                (role.getName().equals("SUPER_ADMIN") ||
                        role.getName().equals("HR_ADMIN") ||
                        role.getName().equals("ADMIN"));

        if (!isSameOrg && !isGlobalAdmin) {
            log.warn("Access denied for User {} on Job {}", actorId, job.getId());
            throw new AccessDeniedException(
                    "You do not have permission to modify this job.");
        }
    }

    @Transactional
    public Job createJob(UUID orgId, String title, String description, String employmentType,
            String requirements, String rolesAndResponsibilities, String experience, String skills,
            BigDecimal billRate, BigDecimal payRate, String status) {
        log.info("Creating job for Organization ID: {}. Title: {}", orgId, title);
        try {
            Organization org = organizationRepository.findById(orgId)
                    .orElseThrow(() -> new EntityNotFoundException("Organization not found: " + orgId));

            // Determine status: default to SUBMITTED if not provided or invalid
            JobStatus jobStatus = JobStatus.SUBMITTED;
            if (status != null && !status.isEmpty()) {
                try {
                    jobStatus = JobStatus.valueOf(status);
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid job status: {}. Defaulting to SUBMITTED.", status);
                    jobStatus = JobStatus.SUBMITTED;
                }
            }

            Job job = Job.builder()
                    .organization(org)
                    .title(title)
                    .description(description)
                    .employmentType(EmploymentType.valueOf(employmentType))
                    .requirements(requirements)
                    .rolesAndResponsibilities(rolesAndResponsibilities)
                    .experience(experience)
                    .skills(skills)
                    .billRate(billRate)
                    .payRate(payRate)
                    .status(jobStatus)
                    .build();

            jobRepository.save(job);
            log.info("Job created successfully with ID: {}. Status: {}", job.getId(), jobStatus);

            String statusMessage = jobStatus == JobStatus.DRAFT ? "Job created in DRAFT" : "Job submitted for review";
            timelineService.createEvent(orgId, "JOB", job.getId(), "CREATE", "Job Created", null, statusMessage, null);

            // Notify Org Admins if not Draft
            if (jobStatus != JobStatus.DRAFT) {
                employeeRepository.findByOrganizationId(orgId).forEach(admin -> {
                    notificationService.sendNotification(admin.getId(), "New Job Created",
                            "A new job '" + title + "' has been created/submitted.",
                            "JOB", job.getId());
                });
            }

            return enhanceJob(job);
        } catch (Exception e) {
            log.error("Error creating job: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public Page<Job> getJobs(UUID orgId, Pageable pageable) {
        log.info("Fetching jobs for Org ID: {}", orgId);
        Page<Job> jobs = jobRepository.findByOrganizationId(orgId, pageable);
        jobs.forEach(this::enhanceJob);
        return jobs;
    }

    @Transactional(readOnly = true)
    public Page<Job> getAllJobs(Pageable pageable) {
        log.info("Fetching all jobs");
        Page<Job> jobs = jobRepository.findAll(pageable);
        jobs.forEach(this::enhanceJob);
        return jobs;
    }

    @Transactional(readOnly = true)
    public Page<Job> getPublishedJobs(Pageable pageable) {
        log.info("Fetching published jobs");
        Page<Job> jobs = jobRepository.findByStatusIn(List.of(JobStatus.PUBLISHED), pageable);
        jobs.forEach(this::enhanceJob);
        return jobs;
    }

    @Transactional(readOnly = true)
    public Job getJob(UUID id) {
        log.debug("Fetching Job ID: {}", id);
        Job job = jobRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Job not found"));
        return enhanceJob(job);
    }

    @Transactional
    public Job updateStatus(UUID jobId, JobStatus newStatus, UUID actorId, String message) {
        log.info("Updating status for Job ID: {} to {}", jobId, newStatus);
        try {
            Job job = getJob(jobId);
            validateAccess(job, actorId);
            JobStatus oldStatus = job.getStatus();
            job.setStatus(newStatus);

            jobRepository.save(job);

            timelineService.createEvent(job.getOrganization().getId(), "JOB", jobId, "STATUS_CHANGE",
                    "Job Status Changed",
                    actorId,
                    String.format("Status changed from %s to %s. %s", oldStatus, newStatus, message), null);

            log.info("Job status updated successfully for {}", jobId);

            // Notify Org Admins
            String statusTitle = "Job Status Updated";
            String statusBody = "Job '" + job.getTitle() + "' status changed from " + oldStatus + " to " + newStatus + ".";
            employeeRepository.findByOrganizationId(job.getOrganization().getId()).forEach(admin -> {
                // Don't notify actor? No, notify everyone to be safe/consistent
                notificationService.sendNotification(admin.getId(), statusTitle, statusBody, "JOB", jobId);
            });

            return enhanceJob(job);
        } catch (Exception e) {
            log.error("Error updating job status for {}: {}", jobId, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public Job updateJob(UUID jobId, String title, String description, String employmentType,
            BigDecimal billRate, BigDecimal payRate, UUID actorId) {
        log.info("Updating details for Job ID: {} by Actor ID: {}", jobId, actorId);
        try {
            Job job = getJob(jobId);
            validateAccess(job, actorId);
            job.setTitle(title);
            job.setDescription(description);
            job.setEmploymentType(EmploymentType.valueOf(employmentType));
            if (billRate != null)
                job.setBillRate(billRate);
            if (payRate != null)
                job.setPayRate(payRate);

            jobRepository.save(job);

            timelineService.createEvent(job.getOrganization().getId(), "JOB", jobId, "UPDATE", "Job Updated", actorId,
                    "Job details updated", null);
            log.info("Job details updated successfully for {}", jobId);
            return enhanceJob(job);
        } catch (Exception e) {
            log.error("Error updating job details for {}: {}", jobId, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public Job verifyJob(UUID jobId, UUID actorId) {
        log.info("Verifying Job ID: {} by Actor ID: {}", jobId, actorId);
        try {
            Job job = getJob(jobId);
            validateAccess(job, actorId);
            // Validations: Only transition if status is DRAFT or VENDOR_SUBMITTED
            job.setStatus(JobStatus.ADMIN_VERIFIED);
            jobRepository.save(job);
            timelineService.createEvent(job.getOrganization().getId(), "JOB", jobId, "VERIFY", "Job Verified", actorId,
                    "Job verified by Admin", null);
            log.info("Job verified successfully: {}", jobId);

            // Notify Org Admins
            employeeRepository.findByOrganizationId(job.getOrganization().getId()).forEach(admin -> {
                 notificationService.sendNotification(admin.getId(), "Job Verified", 
                    "Job '" + job.getTitle() + "' has been verified.", "JOB", jobId);
            });

            return enhanceJob(job);
        } catch (Exception e) {
            log.error("Error verifying job {}: {}", jobId, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public Job enrichJob(UUID jobId, String requirements, String rolesResponsibilites, String experience, String skills,
            UUID actorId) {
        log.info("Enriching Job ID: {} by Actor ID: {}", jobId, actorId);
        try {
            Job job = getJob(jobId);
            validateAccess(job, actorId);
            job.setRequirements(requirements);
            job.setRolesAndResponsibilities(rolesResponsibilites);
            job.setExperience(experience);
            job.setSkills(skills);
            job.setStatus(JobStatus.TA_ENRICHED);

            jobRepository.save(job);
            timelineService.createEvent(job.getOrganization().getId(), "JOB", jobId, "ENRICH", "Job Enriched", actorId,
                    "Job enriched by TA", null);
            log.info("Job enriched successfully: {}", jobId);
            return enhanceJob(job);
        } catch (Exception e) {
            log.error("Error enriching job {}: {}", jobId, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public Job approveJob(UUID jobId, BigDecimal billRate, BigDecimal payRate, UUID actorId) {
        log.info("Approving Job ID: {} by Actor ID: {}", jobId, actorId);
        try {
            Job job = getJob(jobId);
            validateAccess(job, actorId);
            if (billRate != null)
                job.setBillRate(billRate);
            if (payRate != null)
                job.setPayRate(payRate);

            job.setStatus(JobStatus.ADMIN_FINAL_VERIFIED);
            jobRepository.save(job);
            timelineService.createEvent(job.getOrganization().getId(), "JOB", jobId, "FINAL_VERIFY",
                    "Job Verified (Final)",
                    actorId,
                    "Job final verified by Admin", null);
            log.info("Job approved successfully: {}", jobId);

            // Notify Org Admins
            employeeRepository.findByOrganizationId(job.getOrganization().getId()).forEach(admin -> {
                 notificationService.sendNotification(admin.getId(), "Job Approved", 
                    "Job '" + job.getTitle() + "' has been finally approved and is ready to publish.", "JOB", jobId);
            });

            return enhanceJob(job);
        } catch (Exception e) {
            log.error("Error approving job {}: {}", jobId, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public Job publishJob(UUID jobId, UUID actorId) {
        log.info("Publishing Job ID: {} by Actor ID: {}", jobId, actorId);
        try {
            Job job = getJob(jobId);
            validateAccess(job, actorId);
            // Maybe check if verified?
            job.setStatus(JobStatus.PUBLISHED);
            jobRepository.save(job);
            timelineService.createEvent(job.getOrganization().getId(), "JOB", jobId, "PUBLISH", "Job Published",
                    actorId,
                    "Job Published",
                    null);

            // Notify Org Admins
            employeeRepository.findByOrganizationId(job.getOrganization().getId()).forEach(admin -> {
                notificationService.sendNotification(admin.getId(), "Job Published",
                        "Job '" + job.getTitle() + "' is now LIVE.",
                        "JOB", job.getId());
            });

            // Notify ALL Approved Vendors
            organizationRepository
                    .findByTypeAndStatus(OrganizationType.VENDOR,
                            OrganizationStatus.APPROVED)
                    .forEach(vendorOrg -> {
                        employeeRepository.findByOrganizationId(vendorOrg.getId()).forEach(vendorUser -> {
                            notificationService.sendNotification(vendorUser.getId(), "New Job Opportunity",
                                    "A new job '" + job.getTitle() + "' is available for your candidates.",
                                    "JOB", job.getId());
                        });
                    });

            log.info("Job published successfully: {}", jobId);
            return enhanceJob(job);
        } catch (Exception e) {
            log.error("Error publishing job {}: {}", jobId, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public void deleteJob(UUID jobId, UUID actorId) {
        log.info("Deleting/Closing Job ID: {} by Actor ID: {}", jobId, actorId);
        try {
            Job job = getJob(jobId);
            validateAccess(job, actorId);

            // Hard delete if draft, soft delete/close otherwise?
            // User requested delete functionality. Simplest is hard delete if allowed, or
            // status=CLOSED.
            // Let's implement status=CLOSED as a safe delete for now, or actual delete if
            // DRAFT.

            if (job.getStatus() == JobStatus.DRAFT) {
                jobRepository.delete(job);
                // Note: Timeline events might orphan if we don't cascade, but standard repo
                // delete doesn't cascade to timeline unless configured.
                // Ideally we soft delete everything. But for "Undo/Delete" feature on draft,
                // hard delete is expected.
                log.info("Job physically deleted (DRAFT): {}", jobId);
            } else {
                job.setStatus(JobStatus.CLOSED);
                jobRepository.save(job);
                timelineService.createEvent(job.getOrganization().getId(), "JOB", jobId, "DELETE", "Job Deleted",
                        actorId,
                        "Job closed/deleted", null);
                log.info("Job marked as CLOSED: {}", jobId);
            }
        } catch (Exception e) {
            log.error("Error deleting job {}: {}", jobId, e.getMessage(), e);
            throw e;
        }
    }

    private Job enhanceJob(Job job) {
        if (job != null && job.getOrganization() != null) {
            organizationService.enhanceOrganization(job.getOrganization());
        }
        return job;
    }
}
