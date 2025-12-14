package com.hrlite.config;

import com.hrlite.entity.Contract;
import com.hrlite.entity.Employee;
import com.hrlite.entity.LeaveRequest;
import com.hrlite.entity.User;
import com.hrlite.entity.enums.ContractType;
import com.hrlite.entity.enums.LeaveStatus;
import com.hrlite.entity.enums.LeaveType;
import com.hrlite.repository.ContractRepository;
import com.hrlite.repository.EmployeeRepository;
import com.hrlite.repository.LeaveRequestRepository;
import com.hrlite.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataLoader implements CommandLineRunner {

        private final EmployeeRepository employeeRepository;
        private final ContractRepository contractRepository;
        private final LeaveRequestRepository leaveRequestRepository;
        private final UserRepository userRepository;
        private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);

        @Override
        @Transactional
        public void run(String... args) {
                log.info("🚀 Starting HR Lite data initialization...");


                createUser("user" , "user" , "user@gmail.com" , encoder.encode("user"));


                // Create 5 realistic employees
                Employee sarah = createEmployee(
                                "Sarah Johnson",
                                "sarah.johnson@hrlite.com",
                                "Senior Software Engineer",
                                new BigDecimal("85000.00"),
                                LocalDate.of(2019, 3, 15),
                                "+1 (555) 123-4567");

                Employee michael = createEmployee(
                                "Michael Chen",
                                "michael.chen@hrlite.com",
                                "Product Manager",
                                new BigDecimal("92000.00"),
                                LocalDate.of(2020, 6, 1),
                                "+1 (555) 234-5678");

                Employee emily = createEmployee(
                                "Emily Rodriguez",
                                "emily.rodriguez@hrlite.com",
                                "UX Designer",
                                new BigDecimal("78000.00"),
                                LocalDate.of(2021, 1, 10),
                                "+1 (555) 345-6789");

                Employee james = createEmployee(
                                "James Wilson",
                                "james.wilson@hrlite.com",
                                "DevOps Engineer",
                                new BigDecimal("88000.00"),
                                LocalDate.of(2018, 9, 20),
                                "+1 (555) 456-7890");

                Employee olivia = createEmployee(
                                "Olivia Martinez",
                                "olivia.martinez@hrlite.com",
                                "HR Manager",
                                new BigDecimal("75000.00"),
                                LocalDate.of(2022, 4, 5),
                                "+1 (555) 567-8901");

                log.info("✅ Created 5 employees");


                // Create contracts for each employee (2 each - showing career progression)

                // Sarah Johnson - Started as intern, now senior
                createContract(sarah, ContractType.INTERNSHIP, LocalDate.of(2019, 3, 15), LocalDate.of(2019, 9, 14),
                                new BigDecimal("35000.00"), false);
                createContract(sarah, ContractType.CDI, LocalDate.of(2019, 9, 15), null, new BigDecimal("85000.00"),
                                true);

                // Michael Chen - Fixed term to permanent
                createContract(michael, ContractType.CDD, LocalDate.of(2020, 6, 1), LocalDate.of(2021, 5, 31),
                                new BigDecimal("80000.00"), false);
                createContract(michael, ContractType.CDI, LocalDate.of(2021, 6, 1), null, new BigDecimal("92000.00"),
                                true);

                // Emily Rodriguez - Direct hire with promotion
                createContract(emily, ContractType.CDI, LocalDate.of(2021, 1, 10), LocalDate.of(2022, 12, 31),
                                new BigDecimal("65000.00"), false);
                createContract(emily, ContractType.CDI, LocalDate.of(2023, 1, 1), null, new BigDecimal("78000.00"),
                                true);

                // James Wilson - Long-term employee
                createContract(james, ContractType.CDD, LocalDate.of(2018, 9, 20), LocalDate.of(2019, 9, 19),
                                new BigDecimal("70000.00"), false);
                createContract(james, ContractType.CDI, LocalDate.of(2019, 9, 20), null, new BigDecimal("88000.00"),
                                true);

                // Olivia Martinez - Recent hire
                createContract(olivia, ContractType.CDD, LocalDate.of(2022, 4, 5), LocalDate.of(2023, 4, 4),
                                new BigDecimal("68000.00"), false);
                createContract(olivia, ContractType.CDI, LocalDate.of(2023, 4, 5), null, new BigDecimal("75000.00"),
                                true);

                log.info("✅ Created 10 contracts (2 per employee)");

                // Create leave requests (mix of statuses)
                LocalDate today = LocalDate.now();

                // Sarah - Approved vacation (currently on leave for demo)
                createLeaveRequest(sarah, LeaveType.PAID, today.minusDays(2), today.plusDays(3), LeaveStatus.APPROVED);
                createLeaveRequest(sarah, LeaveType.SICK, LocalDate.of(2024, 2, 10), LocalDate.of(2024, 2, 12),
                                LeaveStatus.APPROVED);

                // Michael - Pending request
                createLeaveRequest(michael, LeaveType.PAID, today.plusDays(14), today.plusDays(21),
                                LeaveStatus.PENDING);
                createLeaveRequest(michael, LeaveType.UNPAID, LocalDate.of(2024, 1, 5), LocalDate.of(2024, 1, 8),
                                LeaveStatus.APPROVED);

                // Emily - Mix of approved and rejected
                createLeaveRequest(emily, LeaveType.PAID, LocalDate.of(2024, 7, 15), LocalDate.of(2024, 7, 22),
                                LeaveStatus.APPROVED);
                createLeaveRequest(emily, LeaveType.PAID, LocalDate.of(2024, 12, 24), LocalDate.of(2024, 12, 31),
                                LeaveStatus.REJECTED);

                // James - Sick leave (currently on leave for demo)
                createLeaveRequest(james, LeaveType.SICK, today.minusDays(1), today.plusDays(1), LeaveStatus.APPROVED);
                createLeaveRequest(james, LeaveType.PAID, LocalDate.of(2024, 8, 1), LocalDate.of(2024, 8, 15),
                                LeaveStatus.APPROVED);

                // Olivia - Pending requests
                createLeaveRequest(olivia, LeaveType.PAID, today.plusDays(30), today.plusDays(37), LeaveStatus.PENDING);
                createLeaveRequest(olivia, LeaveType.UNPAID, today.plusDays(60), today.plusDays(65),
                                LeaveStatus.PENDING);

                log.info("✅ Created 10 leave requests (various statuses)");
                log.info("🎉 HR Lite data initialization complete!");
                log.info("📊 Dashboard should show: {} total employees, {} on leave today",
                                employeeRepository.count(),
                                leaveRequestRepository.countEmployeesOnLeaveToday(today));
        }

        private Employee createEmployee(String fullName, String email, String position,
                        BigDecimal salary, LocalDate joinDate, String phone) {
                Employee employee = Employee.builder()
                                .fullName(fullName)
                                .email(email)
                                .position(position)
                                .currentSalary(salary)
                                .joinDate(joinDate)
                                .phoneNumber(phone)
                                .build();
                return employeeRepository.save(employee);
        }

        private User createUser(String firstNmae , String lastName, String email, String password) {
                User user = User.builder().firstName(firstNmae).lastName(lastName).email(email).password(password).build();
                return userRepository.save(user);
        }



        private Contract createContract(Employee employee, ContractType type,
                        LocalDate startDate, LocalDate endDate, BigDecimal salary, boolean isActive) {
                Contract contract = Contract.builder()
                                .employee(employee)
                                .type(type)
                                .startDate(startDate)
                                .endDate(endDate)
                                .signedSalary(salary)
                                .isActive(isActive)
                                .build();
                return contractRepository.save(contract);
        }

        private LeaveRequest createLeaveRequest(Employee employee, LeaveType type,
                        LocalDate startDate, LocalDate endDate, LeaveStatus status) {
                LeaveRequest leaveRequest = LeaveRequest.builder()
                                .employee(employee)
                                .type(type)
                                .startDate(startDate)
                                .endDate(endDate)
                                .status(status)
                                .build();
                return leaveRequestRepository.save(leaveRequest);
        }
}
