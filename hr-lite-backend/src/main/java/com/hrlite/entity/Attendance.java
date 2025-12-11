package com.hrlite.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "employee_id", "date" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonBackReference(value = "employee-attendance")
    private Employee employee;

    @NotNull(message = "Date is required")
    @Column(nullable = false)
    private LocalDate date;

    @Column
    private LocalDateTime checkInTime;

    @Column
    private LocalDateTime checkOutTime;

    // Transient field to expose employee ID in JSON responses
    @Transient
    public Long getEmployeeId() {
        return employee != null ? employee.getId() : null;
    }

    // Transient field for employee name
    @Transient
    public String getEmployeeName() {
        return employee != null ? employee.getFullName() : null;
    }

    // Calculate worked hours
    @Transient
    public Long getWorkedMinutes() {
        if (checkInTime == null)
            return null;
        LocalDateTime endTime = checkOutTime != null ? checkOutTime : LocalDateTime.now();
        return java.time.Duration.between(checkInTime, endTime).toMinutes();
    }
}
