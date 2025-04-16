package crypto.service;

import crypto.model.PriceData;
import crypto.repository.PriceDataRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class PriceService {

    private final PriceDataRepository repository;
    private final WebClient webClient = WebClient.create("https://api.binance.com");

    private final Map<String, PriceData> latestPrices = new ConcurrentHashMap<>();

    @Value("${app.symbols:BTCUSDT,ETHUSDT}")
    private String[] symbols;

    private static final int MAX_RECORDS = 500;
    private static final int RECORDS_TO_DELETE = 2;

    @PostConstruct
    public void init() {
        Flux.interval(java.time.Duration.ofSeconds(3))
                .flatMap(tick -> Flux.fromArray(symbols))
                .flatMap(this::fetchPrice)
                .flatMap(this::saveAndUpdate)
                .doOnNext(data -> System.out.println("Price updated: " + data))
                .subscribe(
                        data -> log.info("Price updated: {}", data),
                        error -> log.error("Error fetching price", error)
                );
    }

    private Mono<PriceData> fetchPrice(String symbol) {
        return webClient.get()
                .uri("/api/v3/ticker/price?symbol=" + symbol)
                .retrieve()
                .bodyToMono(Map.class)
                .map(raw -> {
                    BigDecimal price = new BigDecimal((String) raw.get("price"));
                    return PriceData.builder()
                            .symbol(symbol)
                            .price(price)
                            .timestamp(Instant.now())
                            .build();
                });
    }

    Mono<PriceData> saveAndUpdate(PriceData data) {
        return repository.count()
                .flatMap(count -> {
                    if (count >= MAX_RECORDS) {
                        return deleteOldRecords(RECORDS_TO_DELETE)
                                .then(savePriceData(data));
                    } else {
                        return savePriceData(data);
                    }
                });
    }

    private Mono<Void> deleteOldRecords(int numberOfRecords) {
        return repository.findAll()
                .take(numberOfRecords)
                .flatMap(repository::delete)
                .then();
    }

    private Mono<PriceData> savePriceData(PriceData data) {
        latestPrices.put(data.getSymbol(), data);
        return repository.save(data);
    }

    public Flux<PriceData> streamPrices() {
        return Flux.fromIterable(latestPrices.values());
    }

    public Mono<PriceData> getLatestPrice(String symbol) {
        return Mono.justOrEmpty(latestPrices.get(symbol));
    }

    public Flux<PriceData> getAllPrices() {
        return repository.findAll();
    }

    public Flux<PriceData> getPriceBySymbol(String symbol) {
        return repository.findBySymbol(symbol);
    }
}
