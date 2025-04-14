package crypto.controller;

import crypto.security.JwtResponse;
import crypto.security.JwtTokenProvider;
import crypto.security.JwtReactiveAuthenticationManager;
import crypto.service.UserService;
import crypto.util.LoginRequest;
import crypto.util.RegisterRequest;
import org.springframework.beans.factory.annotation.Autowired;
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


//    @PostMapping("/login")
//    public Mono<JwtResponse> login(@RequestBody LoginRequest loginRequest) {
//        System.out.println("Attempting login for user: " + loginRequest.getUsername());
//
//        Mono<Authentication> authentication = jwtReactiveAuthenticationManager.authenticate(
//                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
//        );
//
//        return authentication.map(auth -> {
//                    System.out.println("Authentication successful for user: " + auth.getName());
//                    return new JwtResponse(jwtTokenProvider.generateToken(auth.getName()));
//                })
//                .doOnError(e -> System.out.println("Authentication failed: " + e.getMessage()))
//                .onErrorResume(e -> Mono.just(new JwtResponse("error"))); // Handle the error gracefully
//    }
//
//
//
//@PostMapping("/register")
//public String register(@RequestBody RegisterRequest registerRequest) {
//    System.out.println("Attempting to register user: " + registerRequest.getUsername());
//    userService.registerUser(registerRequest.getUsername(), registerRequest.getPassword());
//    System.out.println("User registered successfully: " + registerRequest.getUsername());
//    return "User registered successfully!";
//}

    @PostMapping("/register")
    public Mono<String> register(@RequestBody RegisterRequest registerRequest) {
        return Mono.fromRunnable(() -> {
            // Регистрация нового пользователя
            userService.registerUser(registerRequest.getUsername(), registerRequest.getPassword());
        }).thenReturn("User registered successfully!");
    }

    // Логин с проверкой пароля
    // Логин с проверкой пароля
    @PostMapping("/login")
    public Mono<JwtResponse> login(@RequestBody LoginRequest loginRequest) {
        // Попытка загрузить пользователя по имени
        return Mono.fromCallable(() -> userService.loadUserByUsername(loginRequest.getUsername()))
                .filter(userDetails -> passwordEncoder.matches(loginRequest.getPassword(), userDetails.getPassword())) // Проверка пароля
                .map(userDetails -> {
                    // Генерация JWT токена
                    String token = jwtTokenProvider.generateToken(userDetails.getUsername());
                    return new JwtResponse(token);
                })
                .switchIfEmpty(Mono.error(new RuntimeException("Invalid credentials"))); // В случае ошибок (неверный логин или пароль)
    }

}
