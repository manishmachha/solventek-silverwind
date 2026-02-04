package com.solventek.silverwind.org;

import com.solventek.silverwind.enums.AssetCondition;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Asset management controller - Solventek HR only
 */
@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
@Slf4j
public class AssetController {

    private final AssetService assetService;

    // ============ ASSET CRUD ============

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    @PostMapping
    public AssetResponse createAsset(@RequestParam String assetTag,
            @RequestParam String assetType,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String model,
            @RequestParam(required = false) String serialNumber,
            @RequestParam(required = false) LocalDate purchaseDate,
            @RequestParam(required = false) LocalDate warrantyUntil,
            @RequestParam(required = false, defaultValue = "true") Boolean active,
            @RequestParam(required = false, defaultValue = "1") Integer totalQuantity) {
        log.info("API: Create Asset {}", assetTag);
        Asset asset = assetService.createAsset(assetTag, assetType, brand, model, serialNumber,
                purchaseDate, warrantyUntil, active, totalQuantity);
        return toResponse(asset);
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    @GetMapping
    public Page<AssetResponse> listAssets(@RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        log.info("API: List Assets, q={}", q);
        Pageable pageable = PageRequest.of(page, size, parseSort(sort));
        return assetService.listAssets(q, pageable).map(this::toResponse);
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    @GetMapping("/{id}")
    public AssetResponse getAsset(@PathVariable UUID id) {
        log.info("API: Get Asset {}", id);
        return toResponse(assetService.getAsset(id));
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    @PutMapping("/{id}")
    public AssetResponse updateAsset(@PathVariable UUID id,
            @RequestParam(required = false) String assetType,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String model,
            @RequestParam(required = false) String serialNumber,
            @RequestParam(required = false) LocalDate purchaseDate,
            @RequestParam(required = false) LocalDate warrantyUntil,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Integer totalQuantity) {
        log.info("API: Update Asset {}", id);
        Asset asset = assetService.updateAsset(id, assetType, brand, model, serialNumber,
                purchaseDate, warrantyUntil, active, totalQuantity);
        return toResponse(asset);
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    @DeleteMapping("/{id}")
    public void deleteAsset(@PathVariable UUID id) {
        log.info("API: Delete Asset {}", id);
        assetService.deleteAsset(id);
    }

    // ============ ASSIGNMENT OPERATIONS ============

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    @PostMapping("/{assetId}/assign/{userId}")
    public AssignmentResponse assignAsset(@PathVariable UUID assetId,
            @PathVariable UUID userId,
            @RequestParam(required = false) LocalDate assignedOn,
            @RequestParam(required = false) AssetCondition condition,
            @RequestParam(required = false) String notes) {
        log.info("API: Assign Asset {} to User {}", assetId, userId);
        EmployeeAssetAssignment assignment = assetService.assignAsset(userId, assetId, assignedOn, condition, notes);
        return toAssignmentResponse(assignment);
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    @GetMapping("/{assetId}/history")
    public List<AssignmentResponse> getAssetHistory(@PathVariable UUID assetId) {
        log.info("API: Get Asset History {}", assetId);
        return assetService.getAssetHistory(assetId).stream().map(this::toAssignmentResponse).toList();
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    @PostMapping("/assignments/{assignmentId}/confirm-return")
    public AssignmentResponse confirmReturn(@PathVariable UUID assignmentId,
            @RequestParam(required = false) LocalDate returnedOn,
            @RequestParam(required = false) AssetCondition conditionOnReturn,
            @RequestParam(required = false) String notes) {
        log.info("API: Confirm Return for assignment {}", assignmentId);
        EmployeeAssetAssignment assignment = assetService.confirmReturn(assignmentId, returnedOn, conditionOnReturn, notes);
        return toAssignmentResponse(assignment);
    }

    // ============ EMPLOYEE SELF-SERVICE ============

    @GetMapping("/my-assets")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public List<AssignmentResponse> getMyAssets() {
        log.info("API: Get My Assets");
        return assetService.getMyAssets().stream().map(this::toAssignmentResponse).toList();
    }

    @PostMapping("/assignments/{assignmentId}/request-return")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public AssignmentResponse requestReturn(@PathVariable UUID assignmentId) {
        log.info("API: Request Return for assignment {}", assignmentId);
        return toAssignmentResponse(assetService.requestReturn(assignmentId));
    }

    // ============ RESPONSE MAPPING ============

    private AssetResponse toResponse(Asset asset) {
        int available = assetService.getAvailableQuantity(asset.getId());
        return AssetResponse.builder()
                .id(asset.getId())
                .assetTag(asset.getAssetTag())
                .assetType(asset.getAssetType())
                .brand(asset.getBrand())
                .model(asset.getModel())
                .serialNumber(asset.getSerialNumber())
                .purchaseDate(asset.getPurchaseDate())
                .warrantyUntil(asset.getWarrantyUntil())
                .active(asset.getActive())
                .totalQuantity(asset.getTotalQuantity())
                .availableQuantity(available)
                .build();
    }

    private AssignmentResponse toAssignmentResponse(EmployeeAssetAssignment a) {
        return AssignmentResponse.builder()
                .id(a.getId())
                .userId(a.getEmployee().getId())
                .userName(a.getEmployee().getFullName())
                .assetId(a.getAsset().getId())
                .assetTag(a.getAsset().getAssetTag())
                .assetType(a.getAsset().getAssetType())
                .assetModel(a.getAsset().getModel())
                .assignedOn(a.getAssignedOn())
                .returnedOn(a.getReturnedOn())
                .conditionOnAssign(a.getConditionOnAssign())
                .conditionOnReturn(a.getConditionOnReturn())
                .status(a.getStatus())
                .notes(a.getNotes())
                .build();
    }

    private Sort parseSort(String sort) {
        if (sort == null || sort.isBlank())
            return Sort.by(Sort.Direction.DESC, "createdAt");
        String[] parts = sort.split(",");
        String field = parts[0].trim();
        Sort.Direction dir = (parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim()))
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        return Sort.by(dir, field);
    }

    // ============ DTOs ============

    @lombok.Builder
    @lombok.Data
    public static class AssetResponse {
        private UUID id;
        private String assetTag;
        private String assetType;
        private String brand;
        private String model;
        private String serialNumber;
        private LocalDate purchaseDate;
        private LocalDate warrantyUntil;
        private Boolean active;
        private Integer totalQuantity;
        private Integer availableQuantity;
    }

    @lombok.Builder
    @lombok.Data
    public static class AssignmentResponse {
        private UUID id;
        private UUID userId;
        private String userName;
        private UUID assetId;
        private String assetTag;
        private String assetType;
        private String assetModel;
        private LocalDate assignedOn;
        private LocalDate returnedOn;
        private AssetCondition conditionOnAssign;
        private AssetCondition conditionOnReturn;
        private com.solventek.silverwind.enums.AssetAssignmentStatus status;
        private String notes;
    }
}
