package crypto.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@ConfigurationProperties(prefix = "alerts")
public class AlertProperties {
    
    private double defaultThreshold;

    private Map<String, Double> thresholds;

    public double getDefaultThreshold() {
        return defaultThreshold;
    }
    public void setDefaultThreshold(double defaultThreshold) {
        this.defaultThreshold = defaultThreshold;
    }
    public Map<String, Double> getThresholds() {
        return thresholds;
    }
    public void setThresholds(Map<String, Double> thresholds) {
        this.thresholds = thresholds;
    }

    public double thresholdFor(String symbol) {
        return thresholds != null && thresholds.containsKey(symbol)
                ? thresholds.get(symbol)
                : defaultThreshold;
    }
}
