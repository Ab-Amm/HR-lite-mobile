package com.hrlite.entity;


import jakarta.persistence.Entity;
import lombok.*;
import lombok.experimental.SuperBuilder;


@Entity
@AllArgsConstructor
@Getter
@Setter
@SuperBuilder
public class Hr extends User {
}
