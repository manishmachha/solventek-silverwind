package com.solventek.silverwind.org;

import com.solventek.silverwind.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "assets", uniqueConstraints = {
        @UniqueConstraint(name = "uk_asset_tag_org", columnNames = { "asset_tag", "org_id" })
}, indexes = {
        @Index(name = "idx_asset_type", columnList = "asset_type"),
        @Index(name = "idx_asset_org", columnList = "org_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Asset extends BaseEntity {

    @NotBlank
    @Size(max = 60)
    @Column(name = "asset_tag", nullable = false, length = 60)
    private String assetTag; // e.g., LT-001

    @NotBlank
    @Size(max = 60)
    @Column(name = "asset_type", nullable = false, length = 60)
    private String assetType; // Laptop, ID Card, Phone

    @Size(max = 120)
    @Column(length = 120)
    private String brand;

    @Size(max = 120)
    @Column(length = 120)
    private String model;

    @Size(max = 120)
    @Column(name = "serial_number", length = 120)
    private String serialNumber;

    private LocalDate purchaseDate;
    private LocalDate warrantyUntil;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "total_quantity", nullable = false, columnDefinition = "integer default 1")
    @Builder.Default
    private Integer totalQuantity = 1;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "org_id", nullable = false, foreignKey = @ForeignKey(name = "fk_asset_org"))
    private Organization organization;
}
