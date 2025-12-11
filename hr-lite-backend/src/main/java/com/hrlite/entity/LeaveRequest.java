package com.hrlite.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.hrlite.entity.enums.LeaveStatus;
import com.hrlite.entity.enums.LeaveType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonBackReference(value = "employee-leaves")
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
}
