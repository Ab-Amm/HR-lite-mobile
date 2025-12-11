package com.hrlite.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.hrlite.entity.enums.ContractType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "contracts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Contract type is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContractType type;

    @NotNull(message = "Start date is required")
    @Column(nullable = false)
    private LocalDate startDate;

    @Column
    private LocalDate endDate; // Nullable for CDI (permanent contracts)

    @NotNull(message = "Signed salary is required")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal signedSalary;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonBackReference(value = "employee-contracts")
    private Employee employee;

    // Transient field to expose employee ID in JSON responses
    @Transient
    public Long getEmployeeId() {
        return employee != null ? employee.getId() : null;
    }
}
