package com.hrlite.Jwt.config;



import com.fasterxml.jackson.databind.ObjectMapper;

import com.hrlite.Jwt.Service.JWTService;
import com.hrlite.Jwt.Service.MyUserDetailsService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JWTService jwtService;

    @Autowired
    ApplicationContext context;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws IOException {

   try{
        String authHeader = request.getHeader("Authorization");
        String token = null;
        String username = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            log.info("token: {}", token);
            username = jwtService.extractUserName(token);
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = context.getBean(MyUserDetailsService.class).loadUserByUsername(username);
            if (jwtService.validateToken(token, userDetails)) {
                Claims claims = jwtService.extractAllClaims(token);
                Long userId = claims.get("userId", Long.class);
                request.setAttribute("userId", userId);
                List<GrantedAuthority> authorities = new ArrayList<>();
                authorities.addAll(userDetails.getAuthorities());

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(userDetails, null ,authorities);
                authToken.setDetails(new WebAuthenticationDetailsSource()
                        .buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

         filterChain.doFilter(request, response);
         }catch (io.jsonwebtoken.security.SignatureException | io.jsonwebtoken.MalformedJwtException ex) {
       response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
       response.setContentType("application/json");

       // Build your JSON response manually
       String json = new ObjectMapper().writeValueAsString(Map.of(
               "error", true,
               "data", Map.of(
                       "errorType", "auth",
                       "error", ex.getMessage()
               )
       ));

       response.getWriter().write(json);
       } catch (Exception ex) {
       response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
       response.setContentType("application/json");

       // Build your JSON response manually
       String json = new ObjectMapper().writeValueAsString(Map.of(
               "error", true,
               "data", Map.of(
                       "errorType", "auth",
                       "error", ex.getMessage()
               )
       ));
       response.getWriter().write(json);
       }
    }
}