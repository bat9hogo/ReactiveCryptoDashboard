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
@Slf4j
public class PriceWebSocketHandler implements WebSocketHandler {

    private final PriceService priceService;

    public PriceWebSocketHandler(PriceService priceService) {
        this.priceService = priceService;
    }

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        Flux<WebSocketMessage> messageFlux = priceService.streamPrices()
                .map(this::toJson)
                .map(session::textMessage);

        return session.send(messageFlux);
    }

    private String toJson(PriceData priceData) {
        return "{\"symbol\": \"" + priceData.getSymbol() + "\", \"price\": " + priceData.getPrice() + "}";
    }
}
