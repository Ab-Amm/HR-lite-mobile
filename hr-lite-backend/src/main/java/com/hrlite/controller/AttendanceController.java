package com.hrlite.controller;

import com.hrlite.entity.Attendance;
import com.hrlite.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AttendanceController {

    private final AttendanceService attendanceService;

    /**
     * Get today's attendance for an employee.
     * GET /api/attendance/today?employeeId=1
     */
    @GetMapping("/today")
    public ResponseEntity<Attendance> getTodayAttendance(@RequestParam Long employeeId) {
        return attendanceService.getTodayAttendance(employeeId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.ok(null)); // Return null if no record (not 404)
    }

    /**
     * Check in an employee.
     * POST /api/attendance/check-in?employeeId=1
     */
    @PostMapping("/check-in")
    public ResponseEntity<?> checkIn(@RequestParam Long employeeId) {
        try {
            Attendance attendance = attendanceService.checkIn(employeeId);
            return ResponseEntity.status(HttpStatus.CREATED).body(attendance);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Check out an employee.
     * POST /api/attendance/check-out?employeeId=1
     */
    @PostMapping("/check-out")
    public ResponseEntity<?> checkOut(@RequestParam Long employeeId) {
        try {
            Attendance attendance = attendanceService.checkOut(employeeId);
            return ResponseEntity.ok(attendance);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get attendance history for an employee.
     * GET /api/attendance/history?employeeId=1
     */
    @GetMapping("/history")
    public ResponseEntity<List<Attendance>> getHistory(@RequestParam Long employeeId) {
        List<Attendance> history = attendanceService.getAttendanceHistory(employeeId);
        return ResponseEntity.ok(history);
    }

    /**
     * Get all attendance records for a specific date.
     * GET /api/attendance/date?date=2025-12-11
     */
    @GetMapping("/date")
    public ResponseEntity<List<Attendance>> getByDate(@RequestParam String date) {
        LocalDate localDate = LocalDate.parse(date);
        List<Attendance> records = attendanceService.getAttendanceByDate(localDate);
        return ResponseEntity.ok(records);
    }

    /**
     * Get stats for today.
     * GET /api/attendance/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(Map.of(
                "checkedInToday", attendanceService.getCheckedInCountToday(),
                "date", LocalDate.now().toString()));
    }
}
