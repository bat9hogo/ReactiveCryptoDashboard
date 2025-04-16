package crypto.config;

import crypto.security.JwtTokenProvider;
import crypto.security.JwtReactiveAuthenticationManager;
import crypto.security.JwtServerAuthenticationConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.authentication.AuthenticationWebFilter;
import org.springframework.security.web.server.context.NoOpServerSecurityContextRepository;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;

    public SecurityConfig(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Bean
    public JwtReactiveAuthenticationManager jwtReactiveAuthenticationManager() {
        return new JwtReactiveAuthenticationManager(jwtTokenProvider);
    }

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers("/auth/login", "/auth/register").permitAll()
                        .pathMatchers("/api/prices", "/api/prices/*").permitAll()
                        .anyExchange().authenticated()
                )
                .securityContextRepository(NoOpServerSecurityContextRepository.getInstance())
                .addFilterAt(corsWebFilter(), SecurityWebFiltersOrder.CORS)
                .addFilterBefore(jwtAuthenticationWebFilter(), SecurityWebFiltersOrder.AUTHENTICATION);

        return http.build();
    }

    @Bean
    public AuthenticationWebFilter jwtAuthenticationWebFilter() {
        AuthenticationWebFilter filter =
                new AuthenticationWebFilter(new JwtReactiveAuthenticationManager(jwtTokenProvider));
        filter.setServerAuthenticationConverter(new JwtServerAuthenticationConverter(jwtTokenProvider));
        return filter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfiguration = new CorsConfiguration();
        corsConfiguration.addAllowedOrigin("http://localhost:8081");
        corsConfiguration.addAllowedMethod("*");
        corsConfiguration.addAllowedHeader("*");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfiguration);

        return new CorsWebFilter(source);
    }
}
