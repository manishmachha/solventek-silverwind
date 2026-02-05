package com.solventek.silverwind.org;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.auth.EmployeeRepository;
import com.solventek.silverwind.enums.AssetAssignmentStatus;
import com.solventek.silverwind.enums.AssetCondition;
import com.solventek.silverwind.security.UserPrincipal;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AssetService {

    private final AssetRepository assetRepository;
    private final EmployeeAssetAssignmentRepository assignmentRepository;
    private final EmployeeRepository employeeRepository;
    private final OrganizationRepository organizationRepository;
    private final com.solventek.silverwind.timeline.TimelineService timelineService;
    private final com.solventek.silverwind.notifications.NotificationService notificationService;

    // ============ ASSET CRUD ============

    public Asset createAsset(String assetTag, String assetType, String brand, String model,
            String serialNumber, LocalDate purchaseDate, LocalDate warrantyUntil,
            Boolean active, Integer totalQuantity) {
        log.info("Attempting to create asset: {} for org", assetTag);
        try {
            UUID orgId = getCurrentUserOrgId();

            if (assetRepository.existsByAssetTagAndOrganization_Id(assetTag, orgId)) {
                log.warn("Asset creation failed: Asset tag {} already exists for org {}", assetTag, orgId);
                throw new IllegalArgumentException("Asset tag already exists in this organization");
            }

            Organization org = organizationRepository.findById(orgId)
                    .orElseThrow(() -> new EntityNotFoundException("Organization not found"));

            Asset asset = Asset.builder()
                    .assetTag(assetTag)
                    .assetType(assetType)
                    .brand(brand)
                    .model(model)
                    .serialNumber(serialNumber)
                    .purchaseDate(purchaseDate)
                    .warrantyUntil(warrantyUntil)
                    .active(active != null ? active : true)
                    .totalQuantity(totalQuantity != null ? totalQuantity : 1)
                    .organization(org)
                    .build();

            Asset saved = assetRepository.save(asset);
            log.info("Asset created successfully: {}", saved.getId());

            timelineService.createEvent(orgId, "ASSET", saved.getId(), "CREATE", "Asset Created", getCurrentUserId(),
                    "Asset " + assetTag + " created", null);
            return saved;
        } catch (Exception e) {
            log.error("Error creating asset {}: {}", assetTag, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public Page<Asset> listAssets(String query, Pageable pageable) {
        UUID orgId = getCurrentUserOrgId();
        log.debug("Listing assets for Org ID: {} with query: {}", orgId, query);
        if (query != null && !query.isBlank()) {
            return assetRepository.search(orgId, query.trim(), pageable);
        }
        return assetRepository.findByOrganization_Id(orgId, pageable);
    }

    @Transactional(readOnly = true)
    public Asset getAsset(UUID assetId) {
        log.debug("Fetching Asset ID: {}", assetId);
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new EntityNotFoundException("Asset not found"));
        ensureSameOrg(asset.getOrganization().getId());
        return asset;
    }

    public Asset updateAsset(UUID assetId, String assetType, String brand, String model,
            String serialNumber, LocalDate purchaseDate, LocalDate warrantyUntil,
            Boolean active, Integer totalQuantity) {
        log.info("Updating asset: {}", assetId);
        try {
            Asset asset = getAsset(assetId);

            if (assetType != null)
                asset.setAssetType(assetType);
            if (brand != null)
                asset.setBrand(brand);
            if (model != null)
                asset.setModel(model);
            if (serialNumber != null)
                asset.setSerialNumber(serialNumber);
            if (purchaseDate != null)
                asset.setPurchaseDate(purchaseDate);
            if (warrantyUntil != null)
                asset.setWarrantyUntil(warrantyUntil);
            if (active != null)
                asset.setActive(active);
            if (totalQuantity != null)
                asset.setTotalQuantity(totalQuantity);

            Asset saved = assetRepository.save(asset);
            log.info("Asset updated successfully: {}", assetId);
            return saved;
        } catch (Exception e) {
            log.error("Error updating asset {}: {}", assetId, e.getMessage(), e);
            throw e;
        }
    }

    public void deleteAsset(UUID assetId) {
        log.info("Deleting asset: {}", assetId);
        try {
            Asset asset = getAsset(assetId);
            assetRepository.delete(asset);
            log.info("Asset deleted successfully: {}", assetId);
        } catch (Exception e) {
            log.error("Error deleting asset {}: {}", assetId, e.getMessage(), e);
            throw e;
        }
    }

    // ============ ASSIGNMENT OPERATIONS ============

    public EmployeeAssetAssignment assignAsset(UUID userId, UUID assetId, LocalDate assignedOn,
            AssetCondition condition, String notes) {
        log.info("Assigning Asset ID: {} to User ID: {}", assetId, userId);
        try {
            Asset asset = getAsset(assetId);
            Employee employee = employeeRepository.findById(userId)
                    .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

            // Ensure user is in same org as asset
            if (!employee.getOrganization().getId().equals(asset.getOrganization().getId())) {
                log.warn("Assignment failed: User {} and Asset {} not in same organization", userId, assetId);
                throw new AccessDeniedException("User and Asset must be in the same organization");
            }

            if (!asset.getActive()) {
                log.warn("Assignment failed: Asset {} is inactive", assetId);
                throw new IllegalArgumentException("Cannot assign an inactive asset");
            }

            long assignedCount = assignmentRepository.countByAsset_IdAndStatus(assetId, AssetAssignmentStatus.ASSIGNED);
            if (assignedCount >= asset.getTotalQuantity()) {
                log.warn("Assignment failed: Asset {} is out of stock", assetId);
                throw new IllegalArgumentException("Asset is out of stock");
            }

            EmployeeAssetAssignment assignment = EmployeeAssetAssignment.builder()
                    .employee(employee)
                    .asset(asset)
                    .assignedOn(assignedOn != null ? assignedOn : LocalDate.now())
                    .conditionOnAssign(condition != null ? condition : AssetCondition.GOOD)
                    .status(AssetAssignmentStatus.ASSIGNED)
                    .notes(notes)
                    .build();

            EmployeeAssetAssignment saved = assignmentRepository.save(assignment);
            log.info("Asset {} assigned successfully to user {}", assetId, userId);

            timelineService.createEvent(asset.getOrganization().getId(), "ASSET_ASSIGNMENT", saved.getId(), "ASSIGN",
                    "Asset Assigned", getCurrentUserId(), userId,
                    "Asset " + asset.getAssetTag() + " assigned to user", null);

            // Notify User
            notificationService.sendNotification(userId, "Asset Assigned",
                    "Asset " + asset.getBrand() + " " + asset.getModel() + " (" + asset.getAssetTag()
                            + ") has been assigned to you.",
                    "ASSET", saved.getId());

            return saved;
        } catch (Exception e) {
            log.error("Error assigning asset {} to user {}: {}", assetId, userId, e.getMessage(), e);
            throw e;
        }
    }

    public EmployeeAssetAssignment requestReturn(UUID assignmentId) {
        log.info("Requesting return for Assignment ID: {}", assignmentId);
        EmployeeAssetAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new EntityNotFoundException("Assignment not found"));

        UUID currentUserId = getCurrentUserId();
        if (!assignment.getEmployee().getId().equals(currentUserId)) {
            throw new AccessDeniedException("You can only request return for your own assigned assets");
        }

        if (assignment.getStatus() != AssetAssignmentStatus.ASSIGNED) {
            throw new IllegalArgumentException("Asset is not in ASSIGNED status");
        }

        assignment.setStatus(AssetAssignmentStatus.RETURN_REQUESTED);
        log.info("Return requested successfully for assignment {}", assignmentId);

        // Notify Org Admins
        notificationService.sendNotificationToOrgAdmins(assignment.getAsset().getOrganization().getId(), 
                "Asset Return Requested", 
                assignment.getEmployee().getFirstName() + " has requested to return asset " + assignment.getAsset().getAssetTag() + ".", 
                "ASSET", 
                assignment.getId());

        return assignmentRepository.save(assignment);
    }

    public EmployeeAssetAssignment confirmReturn(UUID assignmentId, LocalDate returnedOn,
            AssetCondition conditionOnReturn, String notes) {
        log.info("Confirming return for Assignment ID: {}", assignmentId);
        EmployeeAssetAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new EntityNotFoundException("Assignment not found"));

        ensureSameOrg(assignment.getAsset().getOrganization().getId());

        if (assignment.getStatus() != AssetAssignmentStatus.ASSIGNED &&
                assignment.getStatus() != AssetAssignmentStatus.RETURN_REQUESTED) {
            throw new IllegalArgumentException("Asset cannot be returned in current status");
        }

        LocalDate effectiveReturnDate = returnedOn != null ? returnedOn : LocalDate.now();
        if (effectiveReturnDate.isBefore(assignment.getAssignedOn())) {
            throw new IllegalArgumentException("Return date cannot be before assigned date");
        }

        assignment.setReturnedOn(effectiveReturnDate);
        assignment.setConditionOnReturn(conditionOnReturn != null ? conditionOnReturn : AssetCondition.GOOD);
        assignment.setStatus(AssetAssignmentStatus.RETURNED);
        if (notes != null)
            assignment.setNotes(notes);

        log.info("Asset return confirmed for assignment {}", assignmentId);

        timelineService.createEvent(assignment.getAsset().getOrganization().getId(), "ASSET_ASSIGNMENT", assignmentId,
                "RETURN", "Asset Returned", getCurrentUserId(), assignment.getEmployee().getId(),
                "Asset " + assignment.getAsset().getAssetTag() + " returned", null);

        // Notify User
        notificationService.sendNotification(assignment.getEmployee().getId(), "Asset Returned",
                "Return of asset " + assignment.getAsset().getBrand() + " " + assignment.getAsset().getModel()
                        + " (" + assignment.getAsset().getAssetTag() + ") confirmed.",
                "ASSET", assignment.getId());

        return assignmentRepository.save(assignment);
    }

    @Transactional(readOnly = true)
    public List<EmployeeAssetAssignment> getMyAssets() {
        UUID currentUserId = getCurrentUserId();
        log.debug("Fetching assets for Current User ID: {}", currentUserId);
        return assignmentRepository.findByEmployee_Id(currentUserId);
    }

    @Transactional(readOnly = true)
    public List<EmployeeAssetAssignment> getAssetHistory(UUID assetId) {
        log.debug("Fetching history for Asset ID: {}", assetId);
        getAsset(assetId); // Will check org access
        return assignmentRepository.findByAsset_Id(assetId);
    }

    // ============ HELPER METHODS ============

    private UUID getCurrentUserOrgId() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return principal.getOrgId();
    }

    private UUID getCurrentUserId() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return principal.getId();
    }

    private void ensureSameOrg(UUID targetOrgId) {
        UUID myOrgId = getCurrentUserOrgId();
        if (!myOrgId.equals(targetOrgId)) {
            throw new AccessDeniedException("Access denied: different organization");
        }
    }

    // Helper to get available quantity
    public int getAvailableQuantity(UUID assetId) {
        log.trace("Calculating available quantity for Asset ID: {}", assetId);
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new EntityNotFoundException("Asset not found"));
        long assigned = assignmentRepository.countByAsset_IdAndStatus(assetId, AssetAssignmentStatus.ASSIGNED);
        return asset.getTotalQuantity() - (int) assigned;
    }
}
