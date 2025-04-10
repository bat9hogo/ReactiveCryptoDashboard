package crypto.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import crypto.model.PriceData;
import crypto.service.PriceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketMessage;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
public class PriceWebSocketHandler implements WebSocketHandler {

    private final PriceService priceService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        Flux<WebSocketMessage> messageFlux = priceService.streamPrices()
                .map(this::toJson)
                .map(session::textMessage)
                .doOnError(error -> log.error("WebSocket error", error));

        return session.send(messageFlux);
    }

    private String toJson(PriceData priceData) {
        try {
            return objectMapper.writeValueAsString(priceData);
        } catch (JsonProcessingException e) {
            log.error("Error serializing PriceData", e);
            return "{}";
        }
    }
}
