package com.solventek.silverwind.rbac;

import com.solventek.silverwind.common.BaseEntity;
import com.solventek.silverwind.org.Organization;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role extends BaseEntity {

    @Column(nullable = false)
    private String name;

    private String description;

    // If org is null, it's a GLOBAL role. If set, it's an Org-specific role.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_id")
    private Organization organization;
}
