package com.solventek.silverwind.org;

import com.solventek.silverwind.common.ApiResponse;
import com.solventek.silverwind.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Holiday management controller - Solventek only
 */
@RestController
@RequestMapping("/api/holidays")
@RequiredArgsConstructor
@Slf4j
public class HolidayController {

    private final HolidayService holidayService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<Holiday>>> getAllHolidays(@AuthenticationPrincipal UserPrincipal currentUser) {
        log.info("API: List All Holidays Request for Org: {}", currentUser.getOrgId());
        return ResponseEntity.ok(ApiResponse.success(holidayService.getAllHolidays(currentUser.getOrgId())));
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<Holiday>> addHoliday(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam LocalDate date,
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @RequestParam(defaultValue = "true") boolean isMandatory) {

        log.info("API: Add Holiday Request. Org: {}, Date: {}, Name: {}", currentUser.getOrgId(), date, name);
        Holiday holiday = holidayService.addHoliday(currentUser.getOrgId(), date, name, description, isMandatory);
        return ResponseEntity.ok(ApiResponse.success("Holiday created successfully.", holiday));
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteHoliday(@AuthenticationPrincipal UserPrincipal currentUser, @PathVariable UUID id) {
        log.info("API: Delete Holiday Request. Org: {}, ID: {}", currentUser.getOrgId(), id);
        holidayService.deleteHoliday(currentUser.getOrgId(), id);
        return ResponseEntity.ok(ApiResponse.success("Holiday deleted successfully.", null));
    }
}
