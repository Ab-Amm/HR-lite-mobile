package com.hrlite.repository;

import com.hrlite.entity.Contract;
import com.hrlite.entity.enums.ContractType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {

    @Query("SELECT c FROM Contract c WHERE c.employee.id = :employeeId")
    List<Contract> findByEmployeeId(@Param("employeeId") Long employeeId);

    @Query("SELECT c FROM Contract c WHERE c.employee.id = :employeeId ORDER BY c.startDate DESC")
    List<Contract> findByEmployeeIdOrderByStartDateDesc(@Param("employeeId") Long employeeId);

    List<Contract> findByType(ContractType type);

    @Query("SELECT c FROM Contract c WHERE c.employee.id = :employeeId AND c.isActive = true")
    Optional<Contract> findByEmployeeIdAndIsActiveTrue(@Param("employeeId") Long employeeId);
}
