package com.hrlite.repository;

import com.hrlite.entity.LeaveRequest;
import com.hrlite.entity.enums.LeaveStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

        @Query("SELECT lr FROM LeaveRequest lr WHERE lr.employee.id = :employeeId")
        List<LeaveRequest> findByEmployeeId(@Param("employeeId") Long employeeId);

        @Query("SELECT lr FROM LeaveRequest lr WHERE lr.employee.id = :employeeId ORDER BY lr.startDate DESC")
        List<LeaveRequest> findByEmployeeIdOrderByStartDateDesc(@Param("employeeId") Long employeeId);

        List<LeaveRequest> findByStatus(LeaveStatus status);

        List<LeaveRequest> findByStatusOrderByStartDateAsc(LeaveStatus status);

        @Query("SELECT lr FROM LeaveRequest lr WHERE lr.status = 'APPROVED' " +
                        "AND lr.startDate <= :date AND lr.endDate >= :date")
        List<LeaveRequest> findApprovedLeavesOnDate(@Param("date") LocalDate date);

        @Query("SELECT COUNT(DISTINCT lr.employee.id) FROM LeaveRequest lr " +
                        "WHERE lr.status = 'APPROVED' AND lr.startDate <= :date AND lr.endDate >= :date")
        long countEmployeesOnLeaveToday(@Param("date") LocalDate date);
}
