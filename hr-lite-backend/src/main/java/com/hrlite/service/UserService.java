package com.hrlite.service;

import com.hrlite.Jwt.Model.UserPrincipal;
import com.hrlite.Jwt.Service.JWTService;
import com.hrlite.controller.Response;
import com.hrlite.dto.UserLoginDto;
import com.hrlite.entity.User;
import com.hrlite.entity.enums.Role;
import com.hrlite.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {


    private final UserRepository   userRepository;
    private final JWTService jwtService;
    private  final AuthenticationManager authManager;


    public Response verify(UserLoginDto user) {
        Authentication authentication = authManager.authenticate(new UsernamePasswordAuthenticationToken(user.getUserName(), user.getPassword()));
        Response response = new Response();
        if (authentication.isAuthenticated()) {
            UserPrincipal userDetails = (UserPrincipal) authentication.getPrincipal();
            User userDb  = userDetails.getUser() ;

            userDb = userRepository.save(userDb);
            List<Role> roles = new ArrayList<>();
            roles.add(userDb.getRole());
            String token = jwtService.generateToken(user.getUserName() ,roles, userDetails.getUser().getId());
            response.setError(false);
            response.getData().put("token",token);
            response.getData().put("role", userDb.getRole().toString());

        } else {

            response.setError(false);
            response.getData().put("error", "Authentication failed");

        }
        return response;
    }
}
