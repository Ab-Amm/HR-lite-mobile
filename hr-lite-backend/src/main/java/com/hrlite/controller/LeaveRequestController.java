package com.hrlite.controller;

import com.hrlite.entity.LeaveRequest;
import com.hrlite.entity.enums.LeaveStatus;
import com.hrlite.service.LeaveRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class LeaveRequestController {

    private final LeaveRequestService leaveRequestService;

    @GetMapping
    public ResponseEntity<List<LeaveRequest>> getAllLeaveRequests() {
        List<LeaveRequest> leaveRequests = leaveRequestService.getAllLeaveRequests();
        return ResponseEntity.ok(leaveRequests);
    }

    @GetMapping("/{id}")
    public ResponseEntity<LeaveRequest> getLeaveRequestById(@PathVariable Long id) {
        return leaveRequestService.getLeaveRequestById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<LeaveRequest>> getLeaveRequestsByEmployeeId(@PathVariable Long employeeId) {
        List<LeaveRequest> leaveRequests = leaveRequestService.getLeaveRequestsByEmployeeId(employeeId);
        return ResponseEntity.ok(leaveRequests);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<LeaveRequest>> getPendingLeaveRequests() {
        List<LeaveRequest> pendingRequests = leaveRequestService.getPendingLeaveRequests();
        return ResponseEntity.ok(pendingRequests);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<LeaveRequest>> getLeaveRequestsByStatus(@PathVariable LeaveStatus status) {
        List<LeaveRequest> leaveRequests = leaveRequestService.getLeaveRequestsByStatus(status);
        return ResponseEntity.ok(leaveRequests);
    }

    @PostMapping("/employee/{employeeId}")
    public ResponseEntity<LeaveRequest> createLeaveRequest(@PathVariable Long employeeId,
            @Valid @RequestBody LeaveRequest leaveRequest) {
        try {
            LeaveRequest createdLeaveRequest = leaveRequestService.createLeaveRequest(employeeId, leaveRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdLeaveRequest);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<LeaveRequest> approveLeaveRequest(@PathVariable Long id) {
        try {
            LeaveRequest approvedRequest = leaveRequestService.approveLeaveRequest(id);
            return ResponseEntity.ok(approvedRequest);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<LeaveRequest> rejectLeaveRequest(@PathVariable Long id) {
        try {
            LeaveRequest rejectedRequest = leaveRequestService.rejectLeaveRequest(id);
            return ResponseEntity.ok(rejectedRequest);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<LeaveRequest> cancelLeaveRequest(@PathVariable Long id) {
        try {
            LeaveRequest cancelledRequest = leaveRequestService.cancelLeaveRequest(id);
            return ResponseEntity.ok(cancelledRequest);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<LeaveRequest> updateLeaveRequest(@PathVariable Long id,
            @Valid @RequestBody LeaveRequest leaveRequest) {
        try {
            LeaveRequest updatedLeaveRequest = leaveRequestService.updateLeaveRequest(id, leaveRequest);
            return ResponseEntity.ok(updatedLeaveRequest);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLeaveRequest(@PathVariable Long id) {
        try {
            leaveRequestService.deleteLeaveRequest(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
