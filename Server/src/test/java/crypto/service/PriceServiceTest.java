package crypto.service;

import crypto.model.PriceData;
import crypto.repository.PriceDataRepository;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class PriceServiceTest {

    @Autowired
    private PriceService priceService;

    @MockBean
    private PriceDataRepository priceDataRepository;

    private PriceData priceData;

    @BeforeAll
    void init() {
        priceData = PriceData.builder()
                .symbol("BTCUSDT")
                .price(new BigDecimal("45000"))
                .timestamp(Instant.now())
                .build();
    }

    @Test
    void testGetAllPrices() {
        when(priceDataRepository.findAll()).thenReturn(Flux.just(priceData));

        Flux<PriceData> prices = priceService.getAllPrices();

        List<PriceData> result = prices.collectList().block();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("BTCUSDT", result.get(0).getSymbol());
    }

    @Test
    void testGetPriceBySymbol() {
        when(priceDataRepository.findBySymbol("BTCUSDT")).thenReturn(Flux.just(priceData));

        Flux<PriceData> price = priceService.getPriceBySymbol("BTCUSDT");

        List<PriceData> result = price.collectList().block();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("BTCUSDT", result.get(0).getSymbol());
    }

}
