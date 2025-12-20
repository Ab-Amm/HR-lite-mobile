package com.hrlite.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.hrlite.entity.enums.LeaveStatus;
import com.hrlite.entity.enums.LeaveType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "leave_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Leave type is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeaveType type;

    @NotNull(message = "Start date is required")
    @Column(nullable = false)
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    @Column(nullable = false)
    private LocalDate endDate;

    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private LeaveStatus status = LeaveStatus.PENDING;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnoreProperties({"leaveRequests", "contracts", "password", "attendance", "role", "authorities"})
    private Employee employee;

    // Transient field to expose employee ID in JSON responses
    @Transient
    public Long getEmployeeId() {
        return employee != null ? employee.getId() : null;
    }

    // Transient field to expose employee name in JSON responses
    @Transient
    public String getEmployeeName() {
        return employee != null ? employee.getFullName() : null;
    }

    @Transient
    @JsonProperty("employee")
    public Map<String, Object> getEmployeeSummary() {
        if (employee == null) return null;
        Map<String, Object> summary = new HashMap<>();
        summary.put("id", employee.getId());
        summary.put("fullName", employee.getFullName());
        summary.put("position", employee.getPosition());
        summary.put("email", employee.getEmail());
        return summary;
    }
}
