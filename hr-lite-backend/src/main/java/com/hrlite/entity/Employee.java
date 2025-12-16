package com.hrlite.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "employees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Employee extends User{


    @NotBlank(message = "Full name is required")
    @Column(nullable = false)
    private String fullName;



    @NotBlank(message = "Position is required")
    @Column(nullable = false)
    private String position;

    @NotNull(message = "Current salary is required")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal currentSalary;

    @NotNull(message = "Join date is required")
    @Column(nullable = false)
    private LocalDate joinDate;

    @Column
    private String phoneNumber;

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference(value = "employee-contracts")
    @Builder.Default
    private List<Contract> contracts = new ArrayList<>();

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference(value = "employee-leaves")
    @Builder.Default
    private List<LeaveRequest> leaveRequests = new ArrayList<>();

    // Helper methods for managing relationships
    public void addContract(Contract contract) {
        contracts.add(contract);
        contract.setEmployee(this);
    }

    public void removeContract(Contract contract) {
        contracts.remove(contract);
        contract.setEmployee(null);
    }

    public void addLeaveRequest(LeaveRequest leaveRequest) {
        leaveRequests.add(leaveRequest);
        leaveRequest.setEmployee(this);
    }

    public void removeLeaveRequest(LeaveRequest leaveRequest) {
        leaveRequests.remove(leaveRequest);
        leaveRequest.setEmployee(null);
    }
}
