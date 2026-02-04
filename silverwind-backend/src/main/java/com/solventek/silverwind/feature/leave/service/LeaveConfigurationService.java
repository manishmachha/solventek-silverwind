package com.solventek.silverwind.feature.leave.service;

import com.solventek.silverwind.feature.leave.dto.LeaveTypeDTO;
import com.solventek.silverwind.feature.leave.entity.AccrualFrequency;
import com.solventek.silverwind.feature.leave.entity.LeaveType;
import com.solventek.silverwind.feature.leave.repository.LeaveTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaveConfigurationService {
    private final LeaveTypeRepository leaveTypeRepository;

    public List<LeaveTypeDTO> getAllLeaveTypes(UUID organizationId) {
        return leaveTypeRepository.findAllByOrganizationId(organizationId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public LeaveTypeDTO createLeaveType(LeaveTypeDTO dto, UUID organizationId) {
        if (leaveTypeRepository.existsByNameAndOrganizationId(dto.getName(), organizationId)) {
            throw new RuntimeException("Leave Type already exists");
        }
        LeaveType entity = mapToEntity(dto);
        entity.setOrganizationId(organizationId);
        return mapToDTO(leaveTypeRepository.save(entity));
    }

    public void deleteLeaveType(UUID id) {
        LeaveType type = leaveTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave Type not found"));
        type.setActive(false);
        leaveTypeRepository.save(type);
    }

    public LeaveType validateAndGet(UUID id) {
        return leaveTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave Type not found"));
    }

    private LeaveTypeDTO mapToDTO(LeaveType entity) {
        LeaveTypeDTO dto = new LeaveTypeDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setDefaultDaysPerYear(entity.getDefaultDaysPerYear());
        dto.setCarryForwardAllowed(entity.isCarryForwardAllowed());
        dto.setActive(entity.isActive());
        dto.setAccrualFrequency(
                entity.getAccrualFrequency() != null ? entity.getAccrualFrequency().name() : "ANNUALLY");
        dto.setMaxDaysPerMonth(entity.getMaxDaysPerMonth());
        dto.setMaxConsecutiveDays(entity.getMaxConsecutiveDays());
        dto.setRequiresApproval(entity.isRequiresApproval());
        return dto;
    }

    private LeaveType mapToEntity(LeaveTypeDTO dto) {
        return LeaveType.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .defaultDaysPerYear(dto.getDefaultDaysPerYear())
                .carryForwardAllowed(dto.isCarryForwardAllowed())
                .isActive(true)
                .accrualFrequency(
                        dto.getAccrualFrequency() != null ? AccrualFrequency.valueOf(dto.getAccrualFrequency())
                                : AccrualFrequency.ANNUALLY)
                .maxDaysPerMonth(dto.getMaxDaysPerMonth())
                .maxConsecutiveDays(dto.getMaxConsecutiveDays())
                .requiresApproval(dto.isRequiresApproval())
                .build();
    }
}
