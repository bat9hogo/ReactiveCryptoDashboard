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

    private static final int MAX_RECORDS = 1000;
    private static final int RECORDS_TO_DELETE = 2;

    @PostConstruct
    public void init() {
        Flux.interval(java.time.Duration.ofSeconds(3))
                .flatMap(tick -> Flux.fromArray(symbols))
                .flatMap(this::fetchPrice)
                .flatMap(this::saveAndUpdate)
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

//    Mono<PriceData> saveAndUpdate(PriceData data) {
//        latestPrices.put(data.getSymbol(), data);
//        return repository.findAll()
//                .count()  // Получаем количество записей в базе
//                .flatMap(count -> {
//                    if (count >= 10) {  // Если записей больше или равно 1000
//                        log.info("Too many records, deleting oldest ones...");
//                        // Удаляем старые записи
//                        return repository.deleteAll()  // Удаляем все записи
//                                .then(repository.save(data)); // Сохраняем новую запись
//                    }
//                    return repository.save(data); // Если количество меньше 1000, сохраняем запись
//                });
//    }

    Mono<PriceData> saveAndUpdate(PriceData data) {
        // Удаление старых записей, если их количество превышает лимит
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
        // Удаляем самые старые записи
        return repository.findAll()
                .take(numberOfRecords)  // Берем только нужное количество старых записей
                .flatMap(repository::delete)
                .then();  // Завершаем метод без возвращаемого значения
    }

    private Mono<PriceData> savePriceData(PriceData data) {
        latestPrices.put(data.getSymbol(), data);
        return repository.save(data);
    }

//    private Mono<PriceData> savePriceData(PriceData data) {
//        // Выводим в консоль перед сохранением
//        System.out.println("Attempting to save price data: " + data);
//
//        // Сохраняем данные
//        latestPrices.put(data.getSymbol(), data);
//
//        return repository.save(data)
//                .doOnSuccess(savedData -> {
//                    // Выводим в консоль после успешного сохранения
//                    System.out.println("Successfully saved price data: " + savedData);
//                })
//                .doOnError(error -> {
//                    // Выводим в консоль при ошибке
//                    System.err.println("Error saving price data: " + error.getMessage());
//                });
//    }


    public Flux<PriceData> streamPrices() {
        return Flux.fromIterable(latestPrices.values());
    }

    public Mono<PriceData> getLatestPrice(String symbol) {
        return Mono.justOrEmpty(latestPrices.get(symbol));
    }

    // Добавим методы, которые были вызваны в контроллере:
    public Flux<PriceData> getAllPrices() {
        return repository.findAll();
    }

    public Flux<PriceData> getPriceBySymbol(String symbol) {
        return repository.findBySymbol(symbol);  // Возвращает все записи с данным символом
    }
}
