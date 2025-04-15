package crypto;

import crypto.dto.JwtResponse;
import crypto.dto.LoginRequest;
import crypto.dto.RegisterRequest;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

public class AuthService {
    private final WebClient webClient;

    public AuthService(String baseUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    public Mono<String> register(String username, String password) {
        RegisterRequest request = new RegisterRequest(username, password);
        return webClient.post()
                .uri("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<JwtResponse> login(String username, String password) {
        LoginRequest request = new LoginRequest(username, password);
        return webClient.post()
                .uri("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(JwtResponse.class);
    }
}
