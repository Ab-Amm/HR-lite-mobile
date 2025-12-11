package com.hrlite.service;

import com.hrlite.entity.Employee;
import com.hrlite.repository.EmployeeRepository;
import com.hrlite.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        return employeeRepository.save(employee);
    }

    public Employee updateEmployee(Long id, Employee updatedEmployee) {
        return employeeRepository.findById(id)
                .map(employee -> {
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
