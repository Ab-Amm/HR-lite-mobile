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
}
