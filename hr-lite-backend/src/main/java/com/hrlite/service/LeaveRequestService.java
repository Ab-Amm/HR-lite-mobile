package com.hrlite.service;

import com.hrlite.entity.Employee;
import com.hrlite.entity.LeaveRequest;
import com.hrlite.entity.enums.LeaveStatus;
import com.hrlite.repository.EmployeeRepository;
import com.hrlite.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    public List<LeaveRequest> getAllLeaveRequests() {
        return leaveRequestRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<LeaveRequest> getLeaveRequestById(Long id) {
        return leaveRequestRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<LeaveRequest> getLeaveRequestsByEmployeeId(Long employeeId) {
        return leaveRequestRepository.findByEmployeeIdOrderByStartDateDesc(employeeId);
    }

    @Transactional(readOnly = true)
    public List<LeaveRequest> getLeaveRequestsByStatus(LeaveStatus status) {
        return leaveRequestRepository.findByStatusOrderByStartDateAsc(status);
    }

    @Transactional(readOnly = true)
    public List<LeaveRequest> getPendingLeaveRequests() {
        return leaveRequestRepository.findByStatusOrderByStartDateAsc(LeaveStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public List<LeaveRequest> getApprovedLeavesOnDate(LocalDate date) {
        return leaveRequestRepository.findApprovedLeavesOnDate(date);
    }

    public LeaveRequest createLeaveRequest(Long employeeId, LeaveRequest leaveRequest) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found with id: " + employeeId));

        // Validate dates
        if (leaveRequest.getEndDate().isBefore(leaveRequest.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }

        // Validate start date is not in the past
        if (leaveRequest.getStartDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Cannot request leave for past dates");
        }

        // Validate probation period - must work at least 3 months before requesting leave
        long monthsWorked = ChronoUnit.MONTHS.between(employee.getJoinDate(), LocalDate.now());
        if (monthsWorked < 3) {
            throw new IllegalArgumentException("Cannot request leave during probation period. Must complete 3 months of service.");
        }

        // Validate notice period - must request at least 3 days in advance
        long daysNotice = ChronoUnit.DAYS.between(LocalDate.now(), leaveRequest.getStartDate());
        if (daysNotice < 3) {
            throw new IllegalArgumentException("Leave must be requested at least 3 days in advance");
        }

        // Validate maximum consecutive days - cannot exceed 30 days
        long leaveDays = ChronoUnit.DAYS.between(leaveRequest.getStartDate(), leaveRequest.getEndDate()) + 1;
        if (leaveDays > 30) {
            throw new IllegalArgumentException("Cannot request more than 30 consecutive days of leave");
        }

        // Validate maximum future date - cannot request more than 1 year in advance
        if (leaveRequest.getStartDate().isAfter(LocalDate.now().plusYears(1))) {
            throw new IllegalArgumentException("Cannot request leave more than 1 year in advance");
        }

        // Check for overlapping leave requests
        List<LeaveRequest> existingLeaves = leaveRequestRepository.findByEmployeeIdOrderByStartDateDesc(employeeId);
        for (LeaveRequest existing : existingLeaves) {
            // Only check pending and approved leaves (not rejected)
            if (existing.getStatus() != LeaveStatus.REJECTED && isOverlapping(leaveRequest, existing)) {
                throw new IllegalArgumentException(
                    "Leave request overlaps with existing " + existing.getStatus() + " leave (" + 
                    existing.getType() + " from " + existing.getStartDate() + " to " + existing.getEndDate() + ")");
            }
        }

        leaveRequest.setEmployee(employee);
        leaveRequest.setStatus(LeaveStatus.PENDING);
        return leaveRequestRepository.save(leaveRequest);
    }

    public LeaveRequest approveLeaveRequest(Long id) {
        return leaveRequestRepository.findById(id)
                .map(leaveRequest -> {
                    if (leaveRequest.getStatus() != LeaveStatus.PENDING) {
                        throw new IllegalArgumentException("Can only approve pending leave requests");
                    }
                    leaveRequest.setStatus(LeaveStatus.APPROVED);
                    return leaveRequestRepository.save(leaveRequest);
                })
                .orElseThrow(() -> new IllegalArgumentException("Leave request not found with id: " + id));
    }

    public LeaveRequest rejectLeaveRequest(Long id) {
        return leaveRequestRepository.findById(id)
                .map(leaveRequest -> {
                    if (leaveRequest.getStatus() != LeaveStatus.PENDING) {
                        throw new IllegalArgumentException("Can only reject pending leave requests");
                    }
                    leaveRequest.setStatus(LeaveStatus.REJECTED);
                    return leaveRequestRepository.save(leaveRequest);
                })
                .orElseThrow(() -> new IllegalArgumentException("Leave request not found with id: " + id));
    }

    public LeaveRequest updateLeaveRequest(Long id, LeaveRequest updatedLeaveRequest) {
        return leaveRequestRepository.findById(id)
                .map(leaveRequest -> {
                    if (leaveRequest.getStatus() != LeaveStatus.PENDING) {
                        throw new IllegalArgumentException("Can only update pending leave requests");
                    }
                    
                    // Validate dates
                    if (updatedLeaveRequest.getEndDate().isBefore(updatedLeaveRequest.getStartDate())) {
                        throw new IllegalArgumentException("End date cannot be before start date");
                    }
                    
                    // Validate start date is not in the past
                    if (updatedLeaveRequest.getStartDate().isBefore(LocalDate.now())) {
                        throw new IllegalArgumentException("Cannot update leave to past dates");
                    }
                    
                    leaveRequest.setType(updatedLeaveRequest.getType());
                    leaveRequest.setStartDate(updatedLeaveRequest.getStartDate());
                    leaveRequest.setEndDate(updatedLeaveRequest.getEndDate());
                    return leaveRequestRepository.save(leaveRequest);
                })
                .orElseThrow(() -> new IllegalArgumentException("Leave request not found with id: " + id));
    }

    public void deleteLeaveRequest(Long id) {
        if (!leaveRequestRepository.existsById(id)) {
            throw new IllegalArgumentException("Leave request not found with id: " + id);
        }
        leaveRequestRepository.deleteById(id);
    }

    /**
     * Cancel an approved leave request.
     * Can only cancel if leave hasn't started yet.
     */
    public LeaveRequest cancelLeaveRequest(Long id) {
        return leaveRequestRepository.findById(id)
                .map(leaveRequest -> {
                    if (leaveRequest.getStatus() != LeaveStatus.APPROVED) {
                        throw new IllegalArgumentException("Can only cancel approved leave requests");
                    }
                    
                    // Can only cancel if leave hasn't started
                    if (leaveRequest.getStartDate().isBefore(LocalDate.now()) || 
                        leaveRequest.getStartDate().isEqual(LocalDate.now())) {
                        throw new IllegalArgumentException("Cannot cancel leave that has already started");
                    }
                    
                    leaveRequest.setStatus(LeaveStatus.REJECTED);
                    return leaveRequestRepository.save(leaveRequest);
                })
                .orElseThrow(() -> new IllegalArgumentException("Leave request not found with id: " + id));
    }

    /**
     * Checks if two leave requests have overlapping date ranges.
     */
    private boolean isOverlapping(LeaveRequest leave1, LeaveRequest leave2) {
        return !leave1.getStartDate().isAfter(leave2.getEndDate()) 
            && !leave2.getStartDate().isAfter(leave1.getEndDate());
    }
}
