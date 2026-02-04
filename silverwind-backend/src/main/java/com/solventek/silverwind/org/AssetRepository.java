package com.solventek.silverwind.org;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AssetRepository extends JpaRepository<Asset, UUID> {

    @Query("SELECT a.assetType, COUNT(a) FROM Asset a GROUP BY a.assetType")
    List<Object[]> countByTypeGrouped();

    List<Asset> findByOrganization_Id(UUID orgId);

    Page<Asset> findByOrganization_Id(UUID orgId, Pageable pageable);

    boolean existsByAssetTagAndOrganization_Id(String assetTag, UUID orgId);

    @Query("""
            SELECT a FROM Asset a
            WHERE a.organization.id = :orgId
            AND (LOWER(a.assetTag) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(a.assetType) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(a.brand) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(a.model) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(a.serialNumber) LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<Asset> search(@Param("orgId") UUID orgId, @Param("q") String q, Pageable pageable);
}
