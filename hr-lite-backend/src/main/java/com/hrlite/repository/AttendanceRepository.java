package com.hrlite.repository;

import com.hrlite.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    @Query("SELECT a FROM Attendance a WHERE a.employee.id = :employeeId AND a.date = :date")
    Optional<Attendance> findByEmployeeIdAndDate(@Param("employeeId") Long employeeId, @Param("date") LocalDate date);

    @Query("SELECT a FROM Attendance a WHERE a.employee.id = :employeeId ORDER BY a.date DESC")
    List<Attendance> findByEmployeeIdOrderByDateDesc(@Param("employeeId") Long employeeId);

    @Query("SELECT a FROM Attendance a WHERE a.date = :date ORDER BY a.checkInTime ASC")
    List<Attendance> findByDateOrderByCheckInTime(@Param("date") LocalDate date);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.date = :date AND a.checkInTime IS NOT NULL")
    long countCheckedInToday(@Param("date") LocalDate date);

    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM Attendance a WHERE a.employee.id = :employeeId AND a.date = :date")
    boolean existsByEmployeeAndDate(@Param("employeeId") Long employeeId, @Param("date") LocalDate date);
}
