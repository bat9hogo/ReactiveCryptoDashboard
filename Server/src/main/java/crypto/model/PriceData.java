package crypto.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "price_data")
public class PriceData {

    @Id
    private String id;

    private String symbol;         // Например, BTCUSDT

    private BigDecimal price;      // Текущая цена

    private Instant timestamp;     // Время получения цены
}