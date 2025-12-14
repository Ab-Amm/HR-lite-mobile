package com.hrlite.controller;


import com.hrlite.dto.UserLoginDto;
import com.hrlite.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<Response> login(@RequestBody  UserLoginDto userLoginDto) {

        Response response = userService.verify(userLoginDto);
        return ResponseEntity.ok(response);
    }
}
