package crypto.controller;

import crypto.security.JwtResponse;
import crypto.security.JwtTokenProvider;
import crypto.security.JwtReactiveAuthenticationManager;
import crypto.service.UserService;
import crypto.util.LoginRequest;
import crypto.util.RegisterRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private JwtReactiveAuthenticationManager jwtReactiveAuthenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

//    @PostMapping("/register")
//    public Mono<String> register(@RequestBody RegisterRequest registerRequest) {
//        return Mono.fromRunnable(() -> {
//            userService.registerUser(registerRequest.getUsername(), registerRequest.getPassword());
//        }).thenReturn("User registered successfully!");
//    }

    @PostMapping("/register")
    public Mono<ResponseEntity<String>> register(@RequestBody RegisterRequest registerRequest) {
        return Mono.fromRunnable(() -> {
                    userService.registerUser(registerRequest.getUsername(), registerRequest.getPassword());
                })
                .then(Mono.just(ResponseEntity.ok("Регистрация прошла успешно!")))
                .onErrorResume(e -> {
                    // Логируем полное исключение, если нужно
                    System.err.println("Ошибка регистрации: " + e.getMessage());
                    return Mono.just(ResponseEntity.badRequest()
                            .body("Ошибка регистрации: " + e.getMessage()));
                });
    }

    @PostMapping("/login")
    public Mono<JwtResponse> login(@RequestBody LoginRequest loginRequest) {
        return Mono.fromCallable(() -> userService.loadUserByUsername(loginRequest.getUsername()))
                .filter(userDetails -> passwordEncoder.matches(loginRequest.getPassword(), userDetails.getPassword()))
                .map(userDetails -> {
                    String token = jwtTokenProvider.generateToken(userDetails.getUsername());
                    return new JwtResponse(token);
                })
                .switchIfEmpty(Mono.error(new RuntimeException("Invalid credentials")));
    }

}