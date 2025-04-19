package crypto.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import crypto.config.AlertProperties;
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

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
@RequiredArgsConstructor
public class PriceWebSocketHandler implements WebSocketHandler {

    private final PriceService priceService;
    private final AlertProperties alertProperties;

    private final Map<String, BigDecimal> lastPrices = new ConcurrentHashMap<>();

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        return session.receive()
                .map(WebSocketMessage::getPayloadAsText)
                .flatMap(symbol ->
                        priceService.streamPricesBySymbol(symbol)
                                .flatMap(priceData -> {
                                    Flux<String> updates = Flux.just(toPriceJson(priceData));
                                    return updates.concatWith(generateAlertIfNeeded(priceData));
                                })
                                .map(session::textMessage)
                )
                .as(session::send);
    }


    private Flux<String> generateAlertIfNeeded(PriceData data) {
        String symbol = data.getSymbol();
        BigDecimal newPrice = data.getPrice();
        BigDecimal prevPrice = lastPrices.get(symbol);
        lastPrices.put(symbol, newPrice);

        if (prevPrice != null) {
            BigDecimal changePct = newPrice
                    .subtract(prevPrice)
                    .divide(prevPrice, 6, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));

            BigDecimal threshold = BigDecimal.valueOf(alertProperties.thresholdFor(symbol));

            if (changePct.abs().compareTo(threshold) >= 0) {
                return Flux.just(toAlertJson(symbol, changePct.doubleValue(), newPrice.doubleValue()));

            }
        }
        return Flux.empty();
    }

    private String toPriceJson(PriceData priceData) {
        return "{\"symbol\":\"" + priceData.getSymbol() +
                "\",\"price\":" + priceData.getPrice() + "}";
    }

    private String toAlertJson(String symbol, double changePct, double price) {
        return "{\"type\":\"alert\"" +
                ",\"symbol\":\"" + symbol + "\"" +
                ",\"change\":" + String.format("%.2f", changePct) +
                ",\"price\":" + String.format("%.2f", price) +
                "}";
    }

}
