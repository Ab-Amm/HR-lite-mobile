package com.hrlite.controller;


import lombok.Getter;
import lombok.Setter;

import java.util.HashMap;


@Getter
@Setter
public class Response {
    boolean error ;
    HashMap<String ,Object> data = new HashMap<>(); ;
}