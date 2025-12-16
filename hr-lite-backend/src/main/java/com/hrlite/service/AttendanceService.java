package com.hrlite.service;

import com.hrlite.entity.Attendance;
import com.hrlite.entity.Employee;
import com.hrlite.entity.LeaveRequest;
import com.hrlite.entity.enums.LeaveStatus;
import com.hrlite.repository.AttendanceRepository;
import com.hrlite.repository.EmployeeRepository;
import com.hrlite.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final LeaveRequestRepository leaveRequestRepository;

    /**
     * Get today's attendance record for an employee.
     */
    @Transactional(readOnly = true)
    public Optional<Attendance> getTodayAttendance(Long employeeId) {
        return attendanceRepository.findByEmployeeIdAndDate(employeeId, LocalDate.now());
    }

    /**
     * Check in an employee. Only allowed once per day.
     */
    public Attendance checkIn(Long employeeId) {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        // Check if already checked in today
        if (attendanceRepository.existsByEmployeeAndDate(employeeId, today)) {
            throw new IllegalStateException("Already checked in today");
        }
        
        // Check for previous unclosed check-in (forgot to check out yesterday)
        Optional<Attendance> lastAttendance = attendanceRepository.findByEmployeeIdAndDate(employeeId, today.minusDays(1));
        if (lastAttendance.isPresent() && lastAttendance.get().getCheckOutTime() == null) {
            throw new IllegalStateException("Please complete yesterday's checkout before checking in today");
        }

        // Check if employee is on approved leave today
        List<LeaveRequest> leavesOnDate = leaveRequestRepository.findApprovedLeavesOnDate(today);
        boolean isOnLeave = leavesOnDate.stream()
                .anyMatch(leave -> leave.getEmployee().getId().equals(employeeId));
        if (isOnLeave) {
            throw new IllegalStateException("Cannot check in while on approved leave");
        }

        // Check business hours (6 AM to 10 AM)
        if (now.isBefore(LocalTime.of(6, 0)) || now.isAfter(LocalTime.of(10, 0))) {
            throw new IllegalStateException("Check-in only allowed between 6:00 AM and 10:00 AM");
        }

        // Check if it's weekend
        DayOfWeek dayOfWeek = today.getDayOfWeek();
        if (dayOfWeek == DayOfWeek.SATURDAY || dayOfWeek == DayOfWeek.SUNDAY) {
            throw new IllegalStateException("Cannot check in on weekends");
        }

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found with id: " + employeeId));

        Attendance attendance = Attendance.builder()
                .employee(employee)
                .date(today)
                .checkInTime(LocalDateTime.now())
                .build();

        return attendanceRepository.save(attendance);
    }

    /**
     * Check out an employee. Must have checked in first.
     * Requires minimum 8 hours of work before checkout.
     */
    public Attendance checkOut(Long employeeId) {
        LocalDate today = LocalDate.now();

        Attendance attendance = attendanceRepository.findByEmployeeIdAndDate(employeeId, today)
                .orElseThrow(() -> new IllegalStateException("No check-in record found for today"));

        if (attendance.getCheckOutTime() != null) {
            throw new IllegalStateException("Already checked out today");
        }

        // Validate minimum work hours (8 hours)
        LocalDateTime checkInTime = attendance.getCheckInTime();
        LocalDateTime now = LocalDateTime.now();
        long workedHours = java.time.Duration.between(checkInTime, now).toHours();
        
        if (workedHours < 8) {
            throw new IllegalStateException("Cannot check out before completing 8 hours of work. Worked: " + workedHours + " hours");
        }
        
        // Validate maximum work hours (24 hours - prevents forgotten checkout)
        if (workedHours > 24) {
            throw new IllegalStateException("Invalid checkout time. Cannot work more than 24 hours continuously");
        }

        attendance.setCheckOutTime(now);
        return attendanceRepository.save(attendance);
    }

    /**
     * Get attendance history for an employee.
     */
    @Transactional(readOnly = true)
    public List<Attendance> getAttendanceHistory(Long employeeId) {
        return attendanceRepository.findByEmployeeIdOrderByDateDesc(employeeId);
    }

    /**
     * Get all attendance records for a specific date.
     */
    @Transactional(readOnly = true)
    public List<Attendance> getAttendanceByDate(LocalDate date) {
        return attendanceRepository.findByDateOrderByCheckInTime(date);
    }

    /**
     * Get count of checked-in employees today.
     */
    @Transactional(readOnly = true)
    public long getCheckedInCountToday() {
        return attendanceRepository.countCheckedInToday(LocalDate.now());
    }
}
