package crypto.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    private String id;

    private String username;
    private String password;

    // Добавим метод для получения роли (если потребуется)
    private String role = "USER"; // По умолчанию роль "USER"

    // Если нужны дополнительные аттрибуты, например, email, то можно добавить:
    // private String email;

    // Стандартные геттеры и сеттеры генерируются автоматически благодаря аннотации @Data от Lombok
}
