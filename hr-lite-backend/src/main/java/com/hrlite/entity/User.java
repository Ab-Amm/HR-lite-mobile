package com.hrlite.entity;


import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.hrlite.entity.enums.Role;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.SuperBuilder;

@AllArgsConstructor
@Getter
@Setter
@NoArgsConstructor
@Entity
@SuperBuilder
@Inheritance(strategy = InheritanceType.JOINED)
@Table(name = "users")
public abstract class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    String lastName;
    String firstName;
    @Email(message = "Email should be valid")
    @NotBlank(message = "Email is required")
    @Column(unique = true , nullable = false)
    String email;
    String password;
    @Enumerated(EnumType.STRING)
    Role role;

}

