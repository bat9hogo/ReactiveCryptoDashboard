package crypto;

import reactor.core.publisher.Mono;
import java.util.Scanner;

public class ClientApplication {

	public static void main(String[] args) {
		AuthService authService = new AuthService("http://localhost:8080");
		Scanner scanner = new Scanner(System.in);

		// Ввод данных
		System.out.println("Выберите действие:");
		System.out.println("1. Регистрация");
		System.out.println("2. Вход");

		int choice = scanner.nextInt();
		scanner.nextLine(); // Для поглощения символа новой строки после ввода числа

		System.out.print("Введите имя пользователя: ");
		String username = scanner.nextLine();
		System.out.print("Введите пароль: ");
		String password = scanner.nextLine();

		if (choice == 1) {
			// Регистрация
			authService.register(username, password)
					.doOnNext(response -> System.out.println("Пользователь зарегистрирован"))
					.then(
							authService.login(username, password)
									.doOnNext(response -> System.out.println("JWT Token: " + response.getToken()))
					)
					.block();
		} else if (choice == 2) {
			// Вход
			authService.login(username, password)
					.doOnNext(response -> System.out.println("JWT Token: " + response.getToken()))
					.onErrorResume(error -> {
						System.out.println("Ошибка при входе: " + error.getMessage());
						return Mono.empty();
					})
					.block();
		} else {
			System.out.println("Неверный выбор. Пожалуйста, выберите 1 или 2.");
		}
	}
}
