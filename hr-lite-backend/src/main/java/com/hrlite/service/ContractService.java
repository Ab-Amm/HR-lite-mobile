package com.hrlite.service;

import com.hrlite.entity.Contract;
import com.hrlite.entity.Employee;
import com.hrlite.entity.enums.ContractType;
import com.hrlite.repository.ContractRepository;
import com.hrlite.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
}
