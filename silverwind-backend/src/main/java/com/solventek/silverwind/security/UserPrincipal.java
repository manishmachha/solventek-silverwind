package com.solventek.silverwind.security;

import com.solventek.silverwind.auth.Employee;

import com.solventek.silverwind.rbac.Role;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Getter
public class UserPrincipal implements UserDetails {

    private final UUID id;
    private final String email;
    private final String password;
    private final UUID orgId;
    private final String orgType;
    private final String firstName;
    private final String lastName;
    private final Role role;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(Employee employee) {
        this.id = employee.getId();
        this.email = employee.getEmail();
        this.password = employee.getPasswordHash();
        this.orgId = employee.getOrganization().getId();
        this.orgType = employee.getOrganization().getType().name();
        this.firstName = employee.getFirstName();
        this.lastName = employee.getLastName();
        this.role = employee.getRole();

        Set<GrantedAuthority> authorities = new HashSet<>();
        // Add single role as ROLE_...
        if (employee.getRole() != null) {
            com.solventek.silverwind.rbac.Role role = employee.getRole();
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getName()));
            // Permissions removed - using role-based authorization only
        }
        this.authorities = authorities;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
