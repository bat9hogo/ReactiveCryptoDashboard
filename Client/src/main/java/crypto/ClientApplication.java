package crypto;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.boot.CommandLineRunner;

import java.awt.*;
import java.net.URI;

@SpringBootApplication
public class ClientApplication extends SpringBootServletInitializer implements CommandLineRunner {

	public static void main(String[] args) {
		SpringApplication.run(ClientApplication.class, args);
	}

	@Override
	public void run(String... args) {
		openInBrowser("http://localhost:8081/index.html");
	}

	private void openInBrowser(String url) {
		try {
			if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
				Desktop.getDesktop().browse(new URI(url));
			} else {
				String os = System.getProperty("os.name").toLowerCase();
				if (os.contains("win")) {
					Runtime.getRuntime().exec("rundll32 url.dll,FileProtocolHandler " + url);
				} else if (os.contains("mac")) {
					Runtime.getRuntime().exec("open " + url);
				} else if (os.contains("nix") || os.contains("nux")) {
					Runtime.getRuntime().exec("xdg-open " + url);
				} else {
					System.out.println("Неизвестная ОС, не удалось открыть браузер.");
				}
			}
		} catch (Exception e) {
			System.err.println("Ошибка при попытке открыть браузер: " + e.getMessage());
			e.printStackTrace();
		}
	}
}
