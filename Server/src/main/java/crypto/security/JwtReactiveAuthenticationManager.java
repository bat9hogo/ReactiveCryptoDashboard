package crypto.security;

import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import reactor.core.publisher.Mono;

import java.util.Collections;

public class JwtReactiveAuthenticationManager implements ReactiveAuthenticationManager {

    private final JwtTokenProvider jwtTokenProvider;

    public JwtReactiveAuthenticationManager(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public Mono<Authentication> authenticate(Authentication authentication) {
        String authToken = authentication.getCredentials().toString();
        if (jwtTokenProvider.validateToken(authToken)) {
            String username = jwtTokenProvider.getUsername(authToken);
            return Mono.just(
                    new UsernamePasswordAuthenticationToken(username, null, Collections.emptyList())
            );
        }
        return Mono.empty();
    }


}
