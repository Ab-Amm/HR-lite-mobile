package com.hrlite.service;

import com.hrlite.entity.Contract;
import com.hrlite.entity.Employee;
import com.hrlite.entity.enums.ContractType;
import com.hrlite.repository.ContractRepository;
import com.hrlite.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ContractService {

    private final ContractRepository contractRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    public List<Contract> getAllContracts() {
        return contractRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Contract> getContractById(Long id) {
        return contractRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Contract> getContractsByEmployeeId(Long employeeId) {
        return contractRepository.findByEmployeeIdOrderByStartDateDesc(employeeId);
    }

    @Transactional(readOnly = true)
    public List<Contract> getContractsByType(ContractType type) {
        return contractRepository.findByType(type);
    }

    /**
     * Creates a new contract for an employee.
     * If isActive is true, deactivates all previous contracts and updates
     * employee's current salary.
     */
    public Contract createContract(Long employeeId, Contract contract) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found with id: " + employeeId));

        // Validate positive salary
        if (contract.getSignedSalary() == null || contract.getSignedSalary().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Signed salary must be positive");
        }

        // Validate dates: end date must be after start date
        if (contract.getEndDate() != null && contract.getEndDate().isBefore(contract.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }

        // Validate contract start date cannot be before employee join date
        if (contract.getStartDate().isBefore(employee.getJoinDate())) {
            throw new IllegalArgumentException("Contract start date cannot be before employee join date (" + employee.getJoinDate() + ")");
        }

        // Contract type-specific validations
        if (contract.getType() == ContractType.CDI && contract.getEndDate() != null) {
            throw new IllegalArgumentException("CDI (permanent) contracts cannot have an end date");
        }

        if (contract.getType() == ContractType.INTERNSHIP) {
            // Internship salary should be reasonable (max 30,000)
            if (contract.getSignedSalary().compareTo(new BigDecimal("30000")) > 0) {
                throw new IllegalArgumentException("Internship salary cannot exceed 30,000");
            }
            // Internship must have end date
            if (contract.getEndDate() == null) {
                throw new IllegalArgumentException("Internship contracts must have an end date");
            }
        }

        if (contract.getType() == ContractType.CDD && contract.getEndDate() == null) {
            throw new IllegalArgumentException("CDD (fixed-term) contracts must have an end date");
        }

        // Check for overlapping contracts
        List<Contract> existingContracts = contractRepository.findByEmployeeIdOrderByStartDateDesc(employeeId);
        for (Contract existing : existingContracts) {
            if (isOverlapping(contract, existing)) {
                throw new IllegalArgumentException(
                    "Contract dates overlap with existing contract (" + 
                    existing.getType() + " from " + existing.getStartDate() + " to " + 
                    (existing.getEndDate() != null ? existing.getEndDate() : "ongoing") + ")");
            }
        }

        contract.setEmployee(employee);

        // If this contract is active, deactivate all previous contracts
        if (contract.getIsActive() == null || contract.getIsActive()) {
            contract.setIsActive(true);
            deactivatePreviousContracts(employeeId);

            // Update employee's current salary to match the new active contract
            employee.setCurrentSalary(contract.getSignedSalary());
            employeeRepository.save(employee);
        }

        return contractRepository.save(contract);
    }

    /**
     * Updates an existing contract.
     * If updated to active, deactivates other contracts and syncs employee salary.
     */
    public Contract updateContract(Long id, Contract updatedContract) {
        return contractRepository.findById(id)
                .map(contract -> {
                    // Validate positive salary
                    if (updatedContract.getSignedSalary() != null && 
                        updatedContract.getSignedSalary().compareTo(BigDecimal.ZERO) <= 0) {
                        throw new IllegalArgumentException("Signed salary must be positive");
                    }
                    
                    // Validate dates if being updated
                    if (updatedContract.getStartDate() != null && updatedContract.getEndDate() != null) {
                        if (updatedContract.getEndDate().isBefore(updatedContract.getStartDate())) {
                            throw new IllegalArgumentException("End date cannot be before start date");
                        }
                    }
                    
                    contract.setType(updatedContract.getType());
                    contract.setStartDate(updatedContract.getStartDate());
                    contract.setEndDate(updatedContract.getEndDate());
                    contract.setSignedSalary(updatedContract.getSignedSalary());

                    // Handle active status change
                    if (updatedContract.getIsActive() != null && updatedContract.getIsActive()
                            && !contract.getIsActive()) {
                        // Contract is being activated
                        deactivatePreviousContracts(contract.getEmployee().getId());
                        contract.setIsActive(true);

                        // Update employee salary
                        Employee employee = contract.getEmployee();
                        employee.setCurrentSalary(contract.getSignedSalary());
                        employeeRepository.save(employee);
                    } else if (updatedContract.getIsActive() != null) {
                        contract.setIsActive(updatedContract.getIsActive());
                    }

                    return contractRepository.save(contract);
                })
                .orElseThrow(() -> new IllegalArgumentException("Contract not found with id: " + id));
    }

    public void deleteContract(Long id) {
        if (!contractRepository.existsById(id)) {
            throw new IllegalArgumentException("Contract not found with id: " + id);
        }
        contractRepository.deleteById(id);
    }

    /**
     * Deactivates all contracts for a given employee.
     */
    private void deactivatePreviousContracts(Long employeeId) {
        List<Contract> contracts = contractRepository.findByEmployeeId(employeeId);
        contracts.forEach(c -> c.setIsActive(false));
        contractRepository.saveAll(contracts);
    }

    /**
     * Gets the active contract for an employee.
     */
    @Transactional(readOnly = true)
    public Optional<Contract> getActiveContractForEmployee(Long employeeId) {
        return contractRepository.findByEmployeeIdAndIsActiveTrue(employeeId);
    }

    /**
     * Checks if two contracts have overlapping date ranges.
     */
    private boolean isOverlapping(Contract contract1, Contract contract2) {
        // If either contract has no end date (ongoing), check if start dates conflict
        if (contract1.getEndDate() == null || contract2.getEndDate() == null) {
            // Ongoing contracts overlap if one starts before the other ends (or is also ongoing)
            return !contract1.getStartDate().isAfter(contract2.getEndDate() != null ? contract2.getEndDate() : contract1.getStartDate())
                && !contract2.getStartDate().isAfter(contract1.getEndDate() != null ? contract1.getEndDate() : contract2.getStartDate());
        }
        
        // Both have end dates - check for overlap
        return !contract1.getStartDate().isAfter(contract2.getEndDate()) 
            && !contract2.getStartDate().isAfter(contract1.getEndDate());
    }
}
