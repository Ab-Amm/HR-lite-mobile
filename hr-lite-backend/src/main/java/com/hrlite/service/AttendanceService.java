package com.hrlite.service;

import com.hrlite.entity.Attendance;
import com.hrlite.entity.Employee;
import com.hrlite.repository.AttendanceRepository;
import com.hrlite.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;

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

        // Check if already checked in today
        if (attendanceRepository.existsByEmployeeAndDate(employeeId, today)) {
            throw new IllegalStateException("Already checked in today");
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
     */
    public Attendance checkOut(Long employeeId) {
        LocalDate today = LocalDate.now();

        Attendance attendance = attendanceRepository.findByEmployeeIdAndDate(employeeId, today)
                .orElseThrow(() -> new IllegalStateException("No check-in record found for today"));

        if (attendance.getCheckOutTime() != null) {
            throw new IllegalStateException("Already checked out today");
        }

        attendance.setCheckOutTime(LocalDateTime.now());
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
