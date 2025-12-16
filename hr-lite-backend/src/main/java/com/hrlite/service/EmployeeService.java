package com.hrlite.service;

import com.hrlite.entity.Contract;
import com.hrlite.entity.Employee;
import com.hrlite.entity.LeaveRequest;
import com.hrlite.entity.enums.LeaveStatus;
import com.hrlite.repository.ContractRepository;
import com.hrlite.repository.EmployeeRepository;
import com.hrlite.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final ContractRepository contractRepository;

    @Transactional(readOnly = true)
    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Employee> getEmployeeById(Long id) {
        return employeeRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Employee> getEmployeeByEmail(String email) {
        return employeeRepository.findByEmail(email);
    }

    public Employee createEmployee(Employee employee) {
        if (employeeRepository.existsByEmail(employee.getEmail())) {
            throw new IllegalArgumentException("Employee with email " + employee.getEmail() + " already exists");
        }
        
        // Validate positive salary
        if (employee.getCurrentSalary() == null || employee.getCurrentSalary().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Current salary must be positive");
        }
        
        // Validate join date is not in the future
        if (employee.getJoinDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Join date cannot be in the future");
        }
        
        return employeeRepository.save(employee);
    }

    public Employee updateEmployee(Long id, Employee updatedEmployee) {
        return employeeRepository.findById(id)
                .map(employee -> {
                    // Check for duplicate email (if email is being changed)
                    if (!employee.getEmail().equals(updatedEmployee.getEmail()) && 
                        employeeRepository.existsByEmail(updatedEmployee.getEmail())) {
                        throw new IllegalArgumentException("Employee with email " + updatedEmployee.getEmail() + " already exists");
                    }
                    
                    // Validate positive salary
                    if (updatedEmployee.getCurrentSalary() != null && 
                        updatedEmployee.getCurrentSalary().compareTo(BigDecimal.ZERO) <= 0) {
                        throw new IllegalArgumentException("Current salary must be positive");
                    }
                    
                    employee.setFullName(updatedEmployee.getFullName());
                    employee.setEmail(updatedEmployee.getEmail());
                    employee.setPosition(updatedEmployee.getPosition());
                    employee.setCurrentSalary(updatedEmployee.getCurrentSalary());
                    employee.setPhoneNumber(updatedEmployee.getPhoneNumber());
                    return employeeRepository.save(employee);
                })
                .orElseThrow(() -> new IllegalArgumentException("Employee not found with id: " + id));
    }

    public void deleteEmployee(Long id) {
        if (!employeeRepository.existsById(id)) {
            throw new IllegalArgumentException("Employee not found with id: " + id);
        }

        // Check if employee has active contract
        Optional<Contract> activeContract = contractRepository.findByEmployeeIdAndIsActiveTrue(id);
        if (activeContract.isPresent()) {
            throw new IllegalStateException("Cannot delete employee with active contract. Please deactivate contract first.");
        }

        // Check if employee is currently on approved leave
        List<LeaveRequest> leavesOnDate = leaveRequestRepository.findApprovedLeavesOnDate(LocalDate.now());
        boolean isOnLeave = leavesOnDate.stream()
                .anyMatch(leave -> leave.getEmployee().getId().equals(id));
        if (isOnLeave) {
            throw new IllegalStateException("Cannot delete employee who is currently on approved leave");
        }

        employeeRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public long getTotalEmployeeCount() {
        return employeeRepository.countAllEmployees();
    }

    @Transactional(readOnly = true)
    public long getEmployeesOnLeaveToday() {
        return leaveRequestRepository.countEmployeesOnLeaveToday(LocalDate.now());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalEmployees", getTotalEmployeeCount());
        stats.put("employeesOnLeave", getEmployeesOnLeaveToday());
        stats.put("date", LocalDate.now().toString());
        return stats;
    }
}
