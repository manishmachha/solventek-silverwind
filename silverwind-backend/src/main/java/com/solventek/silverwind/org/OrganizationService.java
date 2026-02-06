package com.solventek.silverwind.org;

import com.solventek.silverwind.auth.AuthController.RegisterVendorRequest;
import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.auth.EmployeeRepository;
import com.solventek.silverwind.rbac.Role;
import com.solventek.silverwind.rbac.RoleDefinitions;
import com.solventek.silverwind.rbac.RoleRepository;
import com.solventek.silverwind.storage.StorageService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.solventek.silverwind.timeline.TimelineService timelineService;
    private final com.solventek.silverwind.notifications.NotificationService notificationService;
    private final com.solventek.silverwind.rbac.RbacService rbacService;
    private final StorageService storageService;
    private final jakarta.persistence.EntityManager entityManager;



    public Organization getOrganization(UUID id) {
        log.debug("Fetching Organization ID: {}", id);
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Organization not found"));
        return enhanceOrganization(org);
    }

    @Transactional
    public Organization registerVendor(RegisterVendorRequest request) {
        log.info("Registering new vendor: {}", request.getOrgName());
        try {
            // 1. Create Organization with all details
            Organization org = Organization.builder()
                    .name(request.getOrgName())
                    .legalName(request.getLegalName())
                    .registrationNumber(request.getRegistrationNumber())
                    .taxId(request.getTaxId())
                    .website(request.getWebsite())
                    .industry(request.getIndustry())
                    .description(request.getDescription())
                    .email(request.getEmail())
                    .phone(request.getCompanyPhone())
                    .addressLine1(request.getAddressLine1())
                    .addressLine2(request.getAddressLine2())
                    .city(request.getCity())
                    .state(request.getState())
                    .country(request.getCountry())
                    .postalCode(request.getPostalCode())
                    .contactPersonName(request.getFirstName() + " " + request.getLastName())
                    .contactPersonEmail(request.getEmail())
                    .contactPersonPhone(request.getPhone())
                    .contactPersonDesignation(request.getDesignation())
                    .employeeCount(request.getEmployeeCount())
                    .yearsInBusiness(request.getYearsInBusiness())
                    .serviceOfferings(request.getServiceOfferings())
                    .keyClients(request.getKeyClients())
                    .referralSource(request.getReferralSource())
                    .type(OrganizationType.VENDOR)
                    .status(OrganizationStatus.PENDING_VERIFICATION)
                    .adminPasswordHash(passwordEncoder.encode(request.getPassword()))
                    .build();
            organizationRepository.save(org);

            // 2. Initialize Roles for this Org (VENDOR role only)
            rbacService.initializeOrgRoles(org.getId());

            timelineService.createEvent(org.getId(), "ORGANIZATION", org.getId(), "REGISTER",
                    "Vendor Registered",
                    null,
                    "Vendor Registered: " + org.getName(), null);

            notifySolventekAdmins("New Vendor Registration",
                    "New vendor " + org.getName() + " has registered.",
                    "ORGANIZATION", org.getId());

            log.info("Successfully registered vendor org: {} (Pending Approval)", org.getId());
            log.info("Successfully registered vendor org: {} (Pending Approval)", org.getId());
            return enhanceOrganization(org);
        } catch (Exception e) {
            log.error("Error registering vendor {}: {}", request.getOrgName(), e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public void approveVendor(UUID vendorOrgId) {
        log.info("Approving vendor organization ID: {}", vendorOrgId);
        try {
            Organization org = organizationRepository.findById(vendorOrgId)
                    .orElseThrow(() -> new EntityNotFoundException("Organization not found"));

            if (org.getType() != OrganizationType.VENDOR) {
                log.warn("Approval failed: Org {} is not a VENDOR (Type: {})", vendorOrgId, org.getType());
                throw new IllegalArgumentException("Only vendors can be approved");
            }

            org.setStatus(OrganizationStatus.APPROVED);

            // Create single Vendor user if password hash is present
            if (org.getAdminPasswordHash() != null) {
                Role vendorRole = roleRepository
                        .findByNameAndOrganizationId(RoleDefinitions.ROLE_VENDOR, org.getId())
                        .orElseThrow(() -> new EntityNotFoundException(
                                "Role VENDOR not found for Org. Cannot create user."));

                String[] names = org.getContactPersonName() != null
                        ? org.getContactPersonName().split(" ", 2)
                        : new String[] { "Vendor", "User" };
                String firstName = names[0];
                String lastName = names.length > 1 ? names[1] : "";

                Employee employee = Employee.builder()
                        .email(org.getContactPersonEmail())
                        .passwordHash(org.getAdminPasswordHash())
                        .firstName(firstName)
                        .lastName(lastName)
                        .phone(org.getContactPersonPhone())
                        .designation(org.getContactPersonDesignation())
                        .organization(org)
                        .role(vendorRole)
                        .enabled(true)
                        .accountLocked(false)
                        .failedLoginAttempts(0)
                        .createdBy("SYSTEM_APPROVAL")
                        .updatedBy("SYSTEM_APPROVAL")
                        .build();

                employeeRepository.save(employee);
                log.info("Created Vendor user for approved vendor: {}", employee.getEmail());

                // Clear the hash for security
                org.setAdminPasswordHash(null);
            }

            organizationRepository.save(org);

            timelineService.createEvent(org.getId(), "ORGANIZATION", org.getId(), "APPROVE",
                    "Vendor Approved",
                    null,
                    "Vendor Approved",
                    null);

            // Notify Vendor user
            java.util.List<Employee> vendorUsers = employeeRepository.findByOrganizationId(org.getId());
            vendorUsers.forEach(user -> notificationService.sendNotification(user.getId(),
                    "Organization Approved",
                    "Your organization has been approved. You can now access the vendor portal.", 
                    "ORGANIZATION", org.getId()));

            log.info("Vendor organization approved successfully: {}", vendorOrgId);
        } catch (Exception e) {
            log.error("Error approving vendor {}: {}", vendorOrgId, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public void rejectVendor(UUID vendorOrgId) {
        log.info("Rejecting vendor organization ID: {}", vendorOrgId);
        try {
            Organization org = organizationRepository.findById(vendorOrgId)
                    .orElseThrow(() -> new EntityNotFoundException("Organization not found"));

            org.setStatus(OrganizationStatus.REJECTED);
            organizationRepository.save(org);

            timelineService.createEvent(org.getId(), "ORGANIZATION", org.getId(), "REJECT",
                    "Vendor Rejected", null,
                    "Vendor Rejected",
                    null);

            log.info("Vendor organization rejected successfully: {}", vendorOrgId);
        } catch (Exception e) {
            log.error("Error rejecting vendor {}: {}", vendorOrgId, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public Organization updateOrganizationStatus(UUID orgId, OrganizationStatus newStatus) {
        log.info("Updating organization status for ID: {} to {}", orgId, newStatus);
        try {
            Organization org = organizationRepository.findById(orgId)
                    .orElseThrow(() -> new EntityNotFoundException("Organization not found"));

            OrganizationStatus oldStatus = org.getStatus();
            org.setStatus(newStatus);
            organizationRepository.save(org);

            timelineService.createEvent(org.getId(), "ORGANIZATION", org.getId(), "STATUS_UPDATE",
                    "Status Updated",
                    null,
                    "Organization status changed from " + oldStatus + " to " + newStatus,
                    null);

            // Notify Organization users
            java.util.List<Employee> users = employeeRepository.findByOrganizationId(org.getId());
            users.forEach(user -> notificationService.sendNotification(user.getId(),
                    "Organization Status Updated",
                    "Your organization status has been changed to " + newStatus + ".",
                    "ORGANIZATION", org.getId()));

            log.info("Organization status updated successfully: {} from {} to {}", orgId, oldStatus, newStatus);
            log.info("Organization status updated successfully: {} from {} to {}", orgId, oldStatus, newStatus);
            return enhanceOrganization(org);
        } catch (Exception e) {
            log.error("Error updating organization status {}: {}", orgId, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public Organization updateOrganization(UUID orgId, OrganizationUpdateDTO dto) {
        log.info("Updating organization ID: {}", orgId);
        try {
            Organization org = organizationRepository.findById(orgId)
                    .orElseThrow(() -> new EntityNotFoundException("Organization not found"));

            if (dto.getName() != null) org.setName(dto.getName());
            if (dto.getDescription() != null) org.setDescription(dto.getDescription());
            if (dto.getWebsite() != null) org.setWebsite(dto.getWebsite());
            if (dto.getIndustry() != null) org.setIndustry(dto.getIndustry());
            if (dto.getEmployeeCount() != null) org.setEmployeeCount(dto.getEmployeeCount());
            if (dto.getPhone() != null) org.setPhone(dto.getPhone());

            // Address
            if (dto.getAddressLine1() != null) org.setAddressLine1(dto.getAddressLine1());
            if (dto.getAddressLine2() != null) org.setAddressLine2(dto.getAddressLine2());
            if (dto.getCity() != null) org.setCity(dto.getCity());
            if (dto.getState() != null) org.setState(dto.getState());
            if (dto.getCountry() != null) org.setCountry(dto.getCountry());
            if (dto.getPostalCode() != null) org.setPostalCode(dto.getPostalCode());

            if (dto.getServiceOfferings() != null) org.setServiceOfferings(dto.getServiceOfferings());

            // Contact Person
            if (dto.getContactPersonName() != null) org.setContactPersonName(dto.getContactPersonName());
            if (dto.getContactPersonEmail() != null) org.setContactPersonEmail(dto.getContactPersonEmail());
            if (dto.getContactPersonPhone() != null) org.setContactPersonPhone(dto.getContactPersonPhone());
            if (dto.getContactPersonDesignation() != null) org.setContactPersonDesignation(dto.getContactPersonDesignation());

            organizationRepository.save(org);

            timelineService.createEvent(org.getId(), "ORGANIZATION", org.getId(), "UPDATE", "Org Updated",
                    null, "Organization details updated", null);

            log.info("Organization updated successfully: {}", orgId);
            log.info("Organization updated successfully: {}", orgId);
            return enhanceOrganization(org);
        } catch (Exception e) {
            log.error("Error updating organization {}: {}", orgId, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Upload organization logo using StorageService.
     * Works with both S3 (production) and local filesystem (development).
     */
    @Transactional
    public String uploadLogo(UUID orgId, MultipartFile file) {
        log.info("Uploading logo for organization ID: {}", orgId);
        try {
            Organization org = organizationRepository.findById(orgId)
                    .orElseThrow(() -> new EntityNotFoundException("Organization not found"));

            String originalFilename = file.getOriginalFilename();
            String extension = "png"; // Default
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1);
            }

            // Sanitized Org Name + extension
            String sanitizedOrgName = org.getName().replaceAll("[^a-zA-Z0-9._-]", "_");
            String storageKey = "logos/" + sanitizedOrgName + "." + extension;

            // Upload using StorageService with custom key
            storageService.uploadWithKey(file, storageKey);

            // Delete old logo if exists AND is different from new key
            if (org.getLogoUrl() != null && !org.getLogoUrl().isEmpty() && !org.getLogoUrl().equals(storageKey)) {
                try {
                    storageService.delete(org.getLogoUrl());
                } catch (Exception e) {
                    log.warn("Failed to delete old logo: {}", org.getLogoUrl());
                }
            }

            org.setLogoUrl(storageKey);
            organizationRepository.save(org);

            log.info("Logo uploaded successfully for org: {}, key: {}", orgId, storageKey);
            return storageKey;

        } catch (Exception e) {
            log.error("Error uploading logo for org {}: {}", orgId, e.getMessage(), e);
            throw new RuntimeException("Failed to upload logo", e);
        }
    }

    /**
     * Get organization logo as a Resource using StorageService.
     */
    public Resource getLogo(UUID orgId) {
        log.debug("Fetching logo for Org ID: {}", orgId);
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new EntityNotFoundException("Organization not found"));

        String storageKey = org.getLogoUrl();
        if (storageKey == null || storageKey.isEmpty()) {
            throw new EntityNotFoundException("Logo not found");
        }

        if (!storageService.exists(storageKey)) {
            throw new EntityNotFoundException("Logo file not found: " + storageKey);
        }

        return storageService.download(storageKey);
    }

    /**
     * Get a presigned/download URL for the organization logo.
     * For S3, returns a presigned URL. For local storage, returns API path.
     */
    public String getLogoUrl(UUID orgId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new EntityNotFoundException("Organization not found"));

        String storageKey = org.getLogoUrl();
        if (storageKey == null || storageKey.isEmpty()) {
            return null;
        }

        return storageService.getPresignedUrl(storageKey, java.time.Duration.ofHours(24));
    }

    public java.util.List<Organization> getPendingVendors() {
        log.debug("Fetching pending vendors");
        java.util.List<Organization> orgs = organizationRepository.findByTypeAndStatus(OrganizationType.VENDOR,
                OrganizationStatus.PENDING_VERIFICATION);
        orgs.forEach(this::enhanceOrganization);
        return orgs;
    }

    public java.util.List<Organization> getAllVendors() {
        log.debug("Fetching all vendors");
        java.util.List<Organization> orgs = organizationRepository.findByType(OrganizationType.VENDOR);
        orgs.forEach(this::enhanceOrganization);
        return orgs;
    }

    public java.util.List<Organization> getAllOrganizations() {
        log.debug("Fetching all organizations");
        java.util.List<Organization> orgs = organizationRepository.findAll();
        orgs.forEach(this::enhanceOrganization);
        return orgs;
    }

    public java.util.List<Employee> getOrganizationEmployees(UUID orgId) {
        log.debug("Fetching employees for Org ID: {}", orgId);
        return employeeRepository.findByOrganizationId(orgId);
    }

    public java.util.List<Organization> getSolventekApprovedOrganizations() {
        log.debug("Fetching Solventek and Approved organizations");
        java.util.List<Organization> orgs = organizationRepository.findByStatus(OrganizationStatus.APPROVED);
        orgs.forEach(this::enhanceOrganization);
        return orgs;
    }

    private void notifySolventekAdmins(String title, String body, String refType, UUID refId) {
        try {
            organizationRepository.findByType(OrganizationType.SOLVENTEK).stream().findFirst()
                    .ifPresent(solventek -> {
                        notificationService.sendNotificationToOrgAdmins(solventek.getId(), title, body, refType, refId);
                    });
        } catch (Exception e) {
            log.error("Failed to notify Solventek admins: {}", e.getMessage());
            // Non-blocking
        }
    }


    /**
     * Helper to generate presigned URL for organization logo if applicable.
     */
    public Organization enhanceOrganization(Organization org) {
        if (org == null) return null;

        // Force initialization of proxy before detaching
        // Accessing a property triggers initialization if it's a proxy attached to the session
        // Only safe if we are inside a transaction (which calling services should ensure)
        try {
            org.getLogoUrl();
            org.getName(); // Ensure main fields are loaded
        } catch (Exception e) {
            // If we can't initialize, we can't enhance safely
            return org;
        }

        // Detach from persistence context so our changes to logoUrl aren't saved back to DB
        if (entityManager.contains(org)) {
            entityManager.detach(org);
        }

        String logoUrl = org.getLogoUrl();
        // If logoUrl is a storage key (i.e., not a presigned URL yet) and valid
        // Check for http (S3) and /api/files/ (Local) to prevent double-prefixing
        if (logoUrl != null && !logoUrl.isEmpty() && !logoUrl.startsWith("http") && !logoUrl.startsWith("/api/files/")) {
            try {
                // Generate presigned URL (valid for 60 mins by default)
                String presignedUrl = storageService.getPresignedUrl(logoUrl, java.time.Duration.ofMinutes(60));
                org.setLogoUrl(presignedUrl);
            } catch (Exception e) {
                // If presigning fails, log but return original
                log.warn("Failed to generate presigned URL for organization logo {}: {}", org.getId(), e.getMessage());
            }
        }
        return org;
    }
}
