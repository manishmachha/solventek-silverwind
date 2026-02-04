package com.solventek.silverwind.org;

import com.solventek.silverwind.enums.AssetAssignmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EmployeeAssetAssignmentRepository extends JpaRepository<EmployeeAssetAssignment, UUID> {

    List<EmployeeAssetAssignment> findByEmployee_Id(UUID employeeId);

    List<EmployeeAssetAssignment> findByAsset_Id(UUID assetId);

    List<EmployeeAssetAssignment> findByAsset_IdAndStatus(UUID assetId, AssetAssignmentStatus status);

    long countByAsset_IdAndStatus(UUID assetId, AssetAssignmentStatus status);
}
