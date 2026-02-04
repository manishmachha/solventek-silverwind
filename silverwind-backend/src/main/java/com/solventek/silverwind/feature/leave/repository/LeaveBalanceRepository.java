package com.solventek.silverwind.feature.leave.repository;

import com.solventek.silverwind.feature.leave.entity.LeaveBalance;
import com.solventek.silverwind.feature.leave.entity.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, UUID> {
    Optional<LeaveBalance> findByEmployeeIdAndYearAndLeaveType(UUID userId, int year, LeaveType leaveType);

    List<LeaveBalance> findByEmployeeIdAndYear(UUID userId, int year);
}
