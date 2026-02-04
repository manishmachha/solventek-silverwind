package com.solventek.silverwind.org;

import com.solventek.silverwind.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "holidays")
public class Holiday extends BaseEntity {

    @NotNull
    @Column(nullable = false)
    private LocalDate date;

    @NotNull
    @Size(min = 2, max = 100)
    @Column(nullable = false, length = 100)
    private String name;

    @Size(max = 255)
    @Column(length = 255)
    private String description;

    @Builder.Default
    @Column(name = "is_mandatory", nullable = false)
    private boolean isMandatory = true;

    // Organization Boundary
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_id", nullable = false)
    private Organization organization;

}
