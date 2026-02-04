package com.solventek.silverwind.rbac;

import com.solventek.silverwind.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rbac")
@RequiredArgsConstructor
public class RbacController {

    private final RbacService rbacService;
    private final com.solventek.silverwind.auth.EmployeeRepository employeeRepository;

    @GetMapping("/roles")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'VENDOR')")
    public ResponseEntity<ApiResponse<List<Role>>> getRoles() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        
        var employee = employeeRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        UUID orgId = employee.getOrganization().getId();
        
        return ResponseEntity.ok(ApiResponse.success(rbacService.getRoles(orgId)));
    }
}
