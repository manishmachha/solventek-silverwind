package com.solventek.silverwind.auth;

import lombok.extern.slf4j.Slf4j;

import com.solventek.silverwind.auth.embeddable.Address;
import com.solventek.silverwind.auth.embeddable.BankDetails;
import com.solventek.silverwind.auth.embeddable.EmergencyContact;
import com.solventek.silverwind.enums.*;
import com.solventek.silverwind.org.OrganizationType;
import com.solventek.silverwind.notifications.NotificationService;
import com.solventek.silverwind.timeline.TimelineService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.solventek.silverwind.org.Organization;
import com.solventek.silverwind.org.OrganizationRepository;
import com.solventek.silverwind.rbac.RoleRepository;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final TimelineService timelineService;
    private final NotificationService notificationService;
    private final OrganizationRepository organizationRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.solventek.silverwind.storage.StorageService storageService;

    @Transactional
    public Employee createEmployee(UUID orgId, String firstName, String lastName, String email,
            String phone, java.time.LocalDate dob, Gender gender, String profilePhotoUrl,
            String employeeCode, java.time.LocalDate doj, EmploymentStatus status, String department,
            String designation, EmploymentType type, String workLocation, String gradeLevel,
            Address address, EmergencyContact emergencyContact, BankDetails bankDetails,
            UUID roleId) {

        log.info("Attempting to create employee: {} {} with Email: {}", firstName, lastName, email);
        if (employeeRepository.existsByEmail(email)) {
            log.warn("Employee creation failed: Email {} already exists", email);
            throw new IllegalArgumentException("Employee with email " + email + " already exists");
        }

        try {
            Organization org = organizationRepository.findById(orgId)
                    .orElseThrow(() -> new EntityNotFoundException("Organization not found: " + orgId));
            com.solventek.silverwind.rbac.Role role = null;
            if (roleId != null) {
                role = roleRepository.findById(roleId)
                        .orElseThrow(() -> new EntityNotFoundException("Role not found: " + roleId));
            }

            // Generate temporary password
            String tempPassword = "Password@123";

            Employee employee = Employee.builder()
                    .firstName(firstName)
                    .lastName(lastName)
                    .email(email)
                    .username(email)
                    .organization(org)
                    .passwordHash(passwordEncoder.encode(tempPassword))
                    .enabled(true)
                    .role(role)
                    .phone(phone)
                    .dateOfBirth(dob)
                    .gender(gender)
                    .profilePhotoUrl(profilePhotoUrl)
                    .employeeCode(employeeCode)
                    .dateOfJoining(doj)
                    .employmentStatus(status)
                    .department(department)
                    .designation(designation)
                    .employmentType(type)
                    .workLocation(workLocation)
                    .gradeLevel(gradeLevel)
                    .address(address)
                    .emergencyContact(emergencyContact)
                    .bankDetails(bankDetails)
                    .build();

            Employee savedEmployee = employeeRepository.save(employee);
            log.info("Successfully created employee with ID: {}", savedEmployee.getId());

            // Notification: Welcome
            notificationService.sendNotification(savedEmployee.getId(), "Welcome to Silverwind!",
                    "Your account has been created successfully. Welcome aboard!", "EMPLOYEE", savedEmployee.getId());

            return enhanceEmployee(savedEmployee);
        } catch (Exception e) {
            log.error("Error creating employee {}: {}", email, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public Employee updateEmployee(UUID employeeId, UUID actorOrgId, String firstName, String lastName,
            String phone, java.time.LocalDate dob, Gender gender, String profilePhotoUrl,
            String employeeCode, java.time.LocalDate doj, EmploymentStatus status, String department,
            String designation, EmploymentType type, String workLocation, String gradeLevel,
            Address address, EmergencyContact emergencyContact, BankDetails bankDetails,
            UUID roleId) {

        log.info("Updating employee profile for Employee ID: {}. Actor Org ID: {}", employeeId, actorOrgId);
        Employee employee = getEmployee(employeeId);

        employee.setFirstName(firstName);
        employee.setLastName(lastName);
        employee.setPhone(phone);
        employee.setDateOfBirth(dob);
        employee.setGender(gender);
        if (profilePhotoUrl != null)
            employee.setProfilePhotoUrl(profilePhotoUrl);

        employee.setEmployeeCode(employeeCode);
        employee.setDateOfJoining(doj);
        employee.setEmploymentStatus(status);
        employee.setDepartment(department);
        employee.setDesignation(designation);
        employee.setEmploymentType(type);
        employee.setWorkLocation(workLocation);
        employee.setGradeLevel(gradeLevel);

        employee.setAddress(address);
        employee.setEmergencyContact(emergencyContact);
        employee.setBankDetails(bankDetails);

        if (roleId != null) {
            com.solventek.silverwind.rbac.Role role = roleRepository.findById(roleId)
                    .orElseThrow(() -> new EntityNotFoundException("Role not found"));
            employee.setRole(role);
        }

        return enhanceEmployee(employeeRepository.save(employee));
    }

    public Employee getEmployee(UUID employeeId) {
        log.debug("Fetching Employee ID: {}", employeeId);
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));
        return enhanceEmployee(employee);
    }

    public org.springframework.data.domain.Page<Employee> getEmployees(UUID orgId,
            org.springframework.data.domain.Pageable pageable) {
        log.debug("Fetching employees for Org ID: {}", orgId);
        org.springframework.data.domain.Page<Employee> page = employeeRepository.findByOrganizationId(orgId, pageable);
        page.getContent().forEach(this::enhanceEmployee);
        return page;
    }

    private void validateAccess(Employee targetEmployee, UUID actorId) {
        log.trace("Validating access for Target Employee ID: {} by Actor ID: {}", targetEmployee.getId(), actorId);
        if (actorId == null) {
            log.warn("Access validation skipped: Actor ID is null (System action or internal call?)");
            return;
        }

        Employee actor = employeeRepository.findById(actorId)
                .orElseThrow(() -> new EntityNotFoundException("Actor not found: " + actorId));

        // Self Update
        if (actor.getId().equals(targetEmployee.getId()))
            return;

        // Same Org Check
        boolean isSameOrg = actor.getOrganization().getId().equals(targetEmployee.getOrganization().getId());

        // Solventek Admin Override
        com.solventek.silverwind.rbac.Role role = actor.getRole();
        boolean isGlobalAdmin = actor.getOrganization().getType() == OrganizationType.SOLVENTEK &&
                role != null &&
                (role.getName().equals("SUPER_ADMIN") || role.getName().equals("HR_ADMIN"));

        if (!isSameOrg && !isGlobalAdmin) {
            log.warn("Access denied: Actor {} tried to modify Employee {} from different organization", actorId,
                    targetEmployee.getId());
            throw new org.springframework.security.access.AccessDeniedException(
                    "You do not have permission to modify this employee.");
        }
    }

    @Transactional
    public Employee updatePersonalDetails(UUID employeeId, UUID actorId, String firstName, String lastName,
            LocalDate dob, Gender gender, String profilePhotoUrl) {
        log.info("Updating personal details for Employee ID: {} by Actor ID: {}", employeeId, actorId);
        try {
            Employee employee = getEmployee(employeeId);
            validateAccess(employee, actorId);
            employee.setFirstName(firstName);
            employee.setLastName(lastName);
            employee.setDateOfBirth(dob);
            employee.setGender(gender);
            if (profilePhotoUrl != null)
                employee.setProfilePhotoUrl(profilePhotoUrl);

            employeeRepository.save(employee);
            timelineService.createEvent(employee.getOrganization().getId(), "EMPLOYEE", employeeId, "UPDATE_PERSONAL",
                    "Personal Details Updated", actorId, employeeId,
                    "Personal details updated", null);
            log.info("Personal details updated successfully for Employee ID: {}", employeeId);
            log.info("Personal details updated successfully for Employee ID: {}", employeeId);
            return enhanceEmployee(employee);
        } catch (Exception e) {
            log.error("Error updating personal details for Employee ID: {}: {}", employeeId, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public Employee updateEmploymentDetails(UUID employeeId, UUID actorId, String employeeCode, LocalDate doj,
            EmploymentStatus status, String department, String designation,
            EmploymentType type, String workLocation, String gradeLevel) {
        log.info("Updating employment details for Employee ID: {} by Actor ID: {}", employeeId, actorId);
        try {
            Employee employee = getEmployee(employeeId);
            validateAccess(employee, actorId);
            employee.setEmployeeCode(employeeCode);
            employee.setDateOfJoining(doj);
            employee.setEmploymentStatus(status);
            employee.setDepartment(department);
            employee.setDesignation(designation);
            employee.setEmploymentType(type);
            employee.setWorkLocation(workLocation);
            employee.setGradeLevel(gradeLevel);

            employeeRepository.save(employee);
            timelineService.createEvent(employee.getOrganization().getId(), "EMPLOYEE", employeeId, "UPDATE_EMPLOYMENT",
                    "Employment Details Updated", actorId, employeeId,
                    "Employment details updated", null);

            log.info("Employment details updated successfully for Employee ID: {}", employeeId);
            log.info("Employment details updated successfully for Employee ID: {}", employeeId);
            return enhanceEmployee(employee);
        } catch (Exception e) {
            log.error("Error updating employment details for Employee ID: {}: {}", employeeId, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public Employee updateContactInfo(UUID employeeId, UUID actorId, String phone, Address address,
            EmergencyContact emergencyContact) {
        log.info("Updating contact info for Employee ID: {} by Actor ID: {}", employeeId, actorId);
        Employee employee = getEmployee(employeeId);
        validateAccess(employee, actorId);
        employee.setPhone(phone);
        employee.setAddress(address);
        employee.setEmergencyContact(emergencyContact);

        employeeRepository.save(employee);
        timelineService.createEvent(employee.getOrganization().getId(), "EMPLOYEE", employeeId, "UPDATE_CONTACT",
                "Contact Info Updated", actorId, employeeId,
                "Contact info updated", null);
        return enhanceEmployee(employee);
    }

    @Transactional
    public Employee updateBankDetails(UUID employeeId, UUID actorId, BankDetails bankDetails, String taxIdPan) {
        log.info("Updating bank details for Employee ID: {} by Actor ID: {}", employeeId, actorId);
        Employee employee = getEmployee(employeeId);
        validateAccess(employee, actorId);
        employee.setBankDetails(bankDetails);
        employee.setTaxIdPan(taxIdPan);

        employeeRepository.save(employee);
        timelineService.createEvent(employee.getOrganization().getId(), "EMPLOYEE", employeeId, "UPDATE_BANK",
                "Bank Details Updated", actorId, employeeId,
                "Bank details updated", null);
        return enhanceEmployee(employee);
    }

    @Transactional
    public Employee updateManager(UUID employeeId, UUID managerId, UUID actorId) {
        log.info("Updating manager for Employee ID: {}. New Manager ID: {}", employeeId, managerId);
        try {
            Employee employee = getEmployee(employeeId);
            validateAccess(employee, actorId);
            Employee manager = null;
            if (managerId != null) {
                manager = getEmployee(managerId);
            }

            employee.setManager(manager);
            employeeRepository.save(employee);

            String msg = "Manager updated to " + (manager != null ? manager.getFirstName() : "None");
            timelineService.createEvent(employee.getOrganization().getId(), "EMPLOYEE", employeeId, "UPDATE_MANAGER",
                    "Manager Updated",
                    actorId, employeeId, msg,
                    null);

            if (manager != null) {
                notificationService.sendNotification(manager.getId(), "New Reportee",
                        employee.getFirstName() + " " + employee.getLastName() + " is now reporting to you.", "EMPLOYEE", employeeId);
            }

            log.info("Manager updated successfully for Employee ID: {}", employeeId);
            log.info("Manager updated successfully for Employee ID: {}", employeeId);
            return enhanceEmployee(employee);
        } catch (Exception e) {
            log.error("Error updating manager for Employee ID: {}: {}", employeeId, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public Employee updateAccountStatus(UUID employeeId, UUID actorId, Boolean enabled, Boolean accountLocked) {
        log.info("Updating account status for Employee ID: {}. Enabled: {}, Locked: {}", employeeId, enabled, accountLocked);
        Employee employee = getEmployee(employeeId);
        validateAccess(employee, actorId);
        if (enabled != null)
            employee.setEnabled(enabled);
        if (accountLocked != null)
            employee.setAccountLocked(accountLocked);

        employeeRepository.save(employee);
        timelineService.createEvent(employee.getOrganization().getId(), "EMPLOYEE", employeeId, "UPDATE_STATUS",
                "Account Status Updated", actorId, employeeId,
                "Account status updated: Enabled=" + employee.getEnabled() + ", Locked=" + employee.getAccountLocked(), null);
        return enhanceEmployee(employee);    }

    @Transactional
    public Employee updateEmploymentStatus(UUID employeeId, UUID actorId, EmploymentStatus employmentStatus) {
        log.info("Updating employment status for Employee ID: {} to {}", employeeId, employmentStatus);
        try {
            Employee employee = getEmployee(employeeId);
            validateAccess(employee, actorId);

            EmploymentStatus previousStatus = employee.getEmploymentStatus();
            employee.setEmploymentStatus(employmentStatus);

            employeeRepository.save(employee);

            String message = "Employment status changed from " + previousStatus + " to " + employmentStatus;
            timelineService.createEvent(employee.getOrganization().getId(), "EMPLOYEE", employeeId, "UPDATE_EMPLOYMENT_STATUS",
                    "Employment Status Updated", actorId, employeeId,
                    message, null);

            // Notify employee about status change
            notificationService.sendNotification(employeeId, "Employment Status Updated",
                    "Your employment status has been changed to " + employmentStatus, "EMPLOYEE", employeeId);

            log.info("Employment status updated successfully for Employee ID: {}", employeeId);
            log.info("Employment status updated successfully for Employee ID: {}", employeeId);
            return enhanceEmployee(employee);
        } catch (Exception e) {
            log.error("Error updating employment status for Employee ID: {}: {}", employeeId, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Convert a C2H employee to Full-Time Employee (FTE)
     */
    @Transactional
    public Employee convertToFullTime(UUID employeeId, UUID actorId, LocalDate conversionDate) {
        log.info("Converting Employee ID: {} to Full-Time Employee (FTE)", employeeId);
        try {
            Employee employee = getEmployee(employeeId);
            validateAccess(employee, actorId);

            if (employee.getEmploymentType() != EmploymentType.C2H) {
                log.warn("Conversion failed: Employee {} is not C2H (Current Type: {})", employeeId, employee.getEmploymentType());
                throw new IllegalStateException("Only C2H employees can be converted to FTE");
            }

            EmploymentType previousType = employee.getEmploymentType();
            employee.setEmploymentType(EmploymentType.FTE);

            employeeRepository.save(employee);

            // Create timeline event for audit
            java.util.Map<String, Object> metadata = new java.util.HashMap<>();
            metadata.put("previousType", previousType.name());
            metadata.put("newType", "FTE");
            metadata.put("conversionDate",
                    conversionDate != null ? conversionDate.toString() : LocalDate.now().toString());

            timelineService.createEvent(employee.getOrganization().getId(), "EMPLOYEE", employeeId, "C2H_CONVERSION",
                    "C2H Conversion",
                    actorId, employeeId,
                    "Employee converted from C2H to Full-Time Employee", metadata);

            // Notify the employee
            notificationService.sendNotification(employeeId, "Congratulations!",
                    "You have been converted to a Full-Time Employee.", "EMPLOYEE", employeeId);

            // Notify HR/Admin
            if (employee.getManager() != null) {
                notificationService.sendNotification(employee.getManager().getId(), "C2H Conversion",
                        employee.getFullName() + " has been converted to Full-Time.", "EMPLOYEE", employeeId);
            }

            log.info("Successfully converted Employee ID: {} to FTE", employeeId);
            log.info("Successfully converted Employee ID: {} to FTE", employeeId);
            return enhanceEmployee(employee);
        } catch (Exception e) {
            log.error("Error converting Employee ID: {} to FTE: {}", employeeId, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Admin change password for an employee
     */
    @Transactional
    public Employee changePassword(UUID employeeId, UUID actorId, String newPassword) {
        log.info("Processing password change for Employee ID: {} by Actor ID: {}", employeeId, actorId);
        try {
            Employee employee = getEmployee(employeeId);
            validateAccess(employee, actorId);

            employee.setPasswordHash(passwordEncoder.encode(newPassword));
            employee.setPasswordUpdatedAt(java.time.Instant.now());
            employeeRepository.save(employee);

            timelineService.createEvent(employee.getOrganization().getId(), "EMPLOYEE", employeeId, "PASSWORD_CHANGE",
                    "Password Changed", actorId, employeeId,
                    "Password was reset by administrator", null);

            // Notification: Password Changed
            notificationService.sendNotification(employeeId, "Security Alert: Password Changed",
                    "Your password has been changed by an administrator. If this wasn't you, please contact support immediately.",
                    "EMPLOYEE", employeeId);

            log.info("Password changed successfully for Employee ID: {}", employeeId);
            log.info("Password changed successfully for Employee ID: {}", employeeId);
            return enhanceEmployee(employee);
        } catch (Exception e) {
            log.error("Error changing password for Employee ID: {}: {}", employeeId, e.getMessage(), e);
            throw e;
        }
    }
        /**
     * Upload profile photo for an employee
     */
    @Transactional
    public Employee uploadProfilePhoto(UUID employeeId, UUID actorId, org.springframework.web.multipart.MultipartFile file) {
        log.info("Uploading profile photo for Employee ID: {} by Actor ID: {}", employeeId, actorId);
        try {
            Employee employee = getEmployee(employeeId);
            validateAccess(employee, actorId);

            // Determine file extension
            String originalFilename = file.getOriginalFilename();
            String extension = "jpg"; // Default
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1);
            }

            // Upload using email as filename
            String email = employee.getEmail();
            String key = "employees/" + email + "/photos/" + email + "." + extension;
            
            storageService.uploadWithKey(file, key);
            String photoUrl = "/api/files/" + key;

            employee.setProfilePhotoUrl(photoUrl);
            employeeRepository.save(employee);

            timelineService.createEvent(employee.getOrganization().getId(), "EMPLOYEE", employeeId, "UPDATE_PHOTO",
                    "Profile Photo Updated", actorId, employeeId,
                    "Profile photo updated", null);

            log.info("Profile photo uploaded successfully for Employee ID: {}", employeeId);

            return enhanceEmployee(employee);
        } catch (Exception e) {
            log.error("Error uploading profile photo for Employee ID: {}: {}", employeeId, e.getMessage(), e);
            throw e;
        }
    }

    public org.springframework.core.io.Resource getProfilePhoto(UUID employeeId) {
        log.debug("Fetching profile photo for Employee ID: {}", employeeId);
        Employee employee = getEmployee(employeeId);
        String photoUrl = employee.getProfilePhotoUrl();
        
        if (photoUrl == null || photoUrl.isEmpty()) {
            throw new EntityNotFoundException("Profile photo not found");
        }

        // Extract key from URL if it contains /api/files/
        String key = photoUrl;
        if (photoUrl.contains("/api/files/")) {
            key = photoUrl.substring(photoUrl.indexOf("/api/files/") + 11);
        }

        return storageService.download(key);
    }

    /**
     * Helper to generate presigned URL for profile photo if applicable.
     * This ensures images are served directly from S3.
     */
    /**
     * Helper to generate presigned URL for profile photo if applicable.
     * This ensures images are served directly from S3.
     */
    private Employee enhanceEmployee(Employee employee) {
        if (employee == null) return null;

        // Create a copy to avoid modifying the managed entity and to avoid using entityManager.detach()
        // which can cause "non-threadsafe access to session" errors in some contexts
        Employee copy = new Employee();
        org.springframework.beans.BeanUtils.copyProperties(employee, copy);

        String photoUrl = copy.getProfilePhotoUrl();
        if (photoUrl != null && photoUrl.startsWith("/api/files/")) {
            try {
                // Extract key from standard path
                String key = photoUrl.replace("/api/files/", "");
                // Generate presigned URL (valid for 60 mins by default)
                String presignedUrl = storageService.getPresignedUrl(key, java.time.Duration.ofMinutes(60));
                copy.setProfilePhotoUrl(presignedUrl);
            } catch (Exception e) {
                // If presigning fails (e.g. key issue), log but return original
                log.warn("Failed to generate presigned URL for employee {}: {}", employee.getId(), e.getMessage());
            }
        }
        return copy;
    }
}
