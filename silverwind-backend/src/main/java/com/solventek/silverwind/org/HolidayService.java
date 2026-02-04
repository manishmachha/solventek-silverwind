package com.solventek.silverwind.org;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class HolidayService {

    private final HolidayRepository holidayRepository;
    private final OrganizationRepository organizationRepository;
    private final com.solventek.silverwind.notifications.NotificationService notificationService;
    private final com.solventek.silverwind.auth.EmployeeRepository employeeRepository;

    public List<Holiday> getAllHolidays(UUID orgId) {
        log.debug("Fetching holidays for Org ID: {}", orgId);
        return holidayRepository.findAllByOrganizationId(orgId);
    }

    @Transactional
    public Holiday addHoliday(UUID orgId, LocalDate date, String name, String description, boolean isMandatory) {
        log.info("Adding holiday '{}' on {} for Org: {}", name, date, orgId);
        try {
            if (holidayRepository.findByOrganizationIdAndDate(orgId, date).isPresent()) {
                log.warn("Holiday addition failed: Holiday already exists on {} for Org {}", date, orgId);
                throw new RuntimeException("Holiday already exists for this date in your organization");
            }

            Organization org = organizationRepository.getReferenceById(orgId);

            Holiday holiday = Holiday.builder()
                    .date(date)
                    .name(name)
                    .description(description)
                    .isMandatory(isMandatory)
                    .organization(org)
                    .build();

            Holiday saved = holidayRepository.save(holiday);
            log.info("Holiday added successfully: {}", saved.getId());

            // Notify all employees in the organization
            employeeRepository.findByOrganizationId(orgId).forEach(user -> {
                notificationService.sendNotification(user.getId(), "New Holiday Added",
                        String.format("📅 %s has been added as a holiday on %s.", name, date),
                        "HOLIDAY", saved.getId());
            });

            return saved;
        } catch (Exception e) {
            log.error("Error adding holiday '{}' for Org {}: {}", name, orgId, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public void deleteHoliday(UUID orgId, UUID holidayId) {
        log.info("Deleting holiday ID: {} for Org: {}", holidayId, orgId);
        try {
            Holiday holiday = holidayRepository.findById(holidayId)
                    .orElseThrow(() -> new RuntimeException("Holiday not found: " + holidayId));

            if (!holiday.getOrganization().getId().equals(orgId)) {
                log.warn("Access denied: Org {} tried to delete holiday {} of another org", orgId, holidayId);
                throw new RuntimeException("You do not have permission to delete this holiday");
            }

            holidayRepository.delete(holiday);
            log.info("Holiday deleted successfully from Org {}", orgId);
        } catch (Exception e) {
            log.error("Error deleting holiday {} for Org {}: {}", holidayId, orgId, e.getMessage(), e);
            throw e;
        }
    }
}
