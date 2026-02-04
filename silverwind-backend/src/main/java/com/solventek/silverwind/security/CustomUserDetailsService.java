package com.solventek.silverwind.security;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.auth.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private final EmployeeRepository employeeRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        log.debug("Authenticating employee with email: {}", email);
        Employee employee = employeeRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.error("Authentication failed: Employee not found with email: {}", email);
                    return new UsernameNotFoundException("Employee not found with email: " + email);
                });

        return new UserPrincipal(employee);
    }
}
