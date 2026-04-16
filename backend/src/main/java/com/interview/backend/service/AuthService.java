package com.interview.backend.service;

import com.interview.backend.dto.AuthRequest;
import com.interview.backend.dto.AuthResponse;
import com.interview.backend.dto.RegisterRequest;
import com.interview.backend.entity.Role;
import com.interview.backend.entity.User;
import com.interview.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

        private final UserRepository repository;
        private final PasswordEncoder passwordEncoder;
        private final JwtService jwtService;
        private final AuthenticationManager authenticationManager;

        public AuthResponse register(RegisterRequest request) {
                var user = User.builder()
                                .name(request.getName())
                                .email(request.getEmail())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .role(Role.USER)
                                .build();
                repository.save(user);

                java.util.Map<String, Object> extraClaims = new java.util.HashMap<>();
                extraClaims.put("userId", user.getId());
                extraClaims.put("name", user.getName());
                var jwtToken = jwtService.generateToken(extraClaims, user);
                return AuthResponse.builder()
                                .token(jwtToken)
                                .build();
        }

        public AuthResponse authenticate(AuthRequest request) {
                authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(
                                                request.getEmail(),
                                                request.getPassword()));
                var user = repository.findFirstByEmailOrderByIdDesc(request.getEmail())
                                .orElseThrow();

                java.util.Map<String, Object> extraClaims = new java.util.HashMap<>();
                extraClaims.put("userId", user.getId());
                extraClaims.put("name", user.getName());
                var jwtToken = jwtService.generateToken(extraClaims, user);
                return AuthResponse.builder()
                                .token(jwtToken)
                                .build();
        }
}
