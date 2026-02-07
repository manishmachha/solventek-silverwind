package com.solventek.silverwind.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;
import com.solventek.silverwind.rbac.Role;
import com.solventek.silverwind.org.Organization;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EmployeeDto {
    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private UUID orgId;
    private String orgType;
    private Role role;
    private Organization organization;
    private String profilePhotoUrl;
}
