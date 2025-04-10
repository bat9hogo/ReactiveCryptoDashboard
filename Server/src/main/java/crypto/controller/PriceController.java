package crypto.controller;

import crypto.model.PriceData;
import crypto.service.PriceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/prices")
@RequiredArgsConstructor
public class PriceController {

    private final PriceService priceService;

    @GetMapping
    public Flux<PriceData> getAll() {
        return priceService.getAllPrices();
    }

    @GetMapping("/{symbol}")
    public Flux<PriceData> getBySymbol(@PathVariable String symbol) {
        return priceService.getPriceBySymbol(symbol);
    }
}
