package com.hrlite.controller;

import com.hrlite.entity.Contract;
import com.hrlite.service.ContractService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ContractController {

    private final ContractService contractService;

    @GetMapping
    public ResponseEntity<List<Contract>> getAllContracts() {
        List<Contract> contracts = contractService.getAllContracts();
        return ResponseEntity.ok(contracts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Contract> getContractById(@PathVariable Long id) {
        return contractService.getContractById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Contract>> getContractsByEmployeeId(@PathVariable Long employeeId) {
        List<Contract> contracts = contractService.getContractsByEmployeeId(employeeId);
        return ResponseEntity.ok(contracts);
    }

    @PostMapping("/employee/{employeeId}")
    public ResponseEntity<Contract> createContract(@PathVariable Long employeeId,
            @Valid @RequestBody Contract contract) {
        try {
            Contract createdContract = contractService.createContract(employeeId, contract);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdContract);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Contract> updateContract(@PathVariable Long id, @Valid @RequestBody Contract contract) {
        try {
            Contract updatedContract = contractService.updateContract(id, contract);
            return ResponseEntity.ok(updatedContract);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContract(@PathVariable Long id) {
        try {
            contractService.deleteContract(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
