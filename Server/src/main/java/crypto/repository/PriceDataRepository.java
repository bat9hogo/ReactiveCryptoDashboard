package crypto.repository;

import crypto.model.PriceData;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

@Repository
public interface PriceDataRepository extends ReactiveMongoRepository<PriceData, String> {
    // Здесь можно будет добавить кастомные reactive-запросы при необходимости
    Flux<PriceData> findBySymbol(String symbol);

    Mono<Void> deleteByTimestampBefore(Instant timestamp);

}
