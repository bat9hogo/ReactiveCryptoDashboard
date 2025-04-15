package crypto;

import com.fasterxml.jackson.databind.ObjectMapper;
import crypto.dto.RegisterRequest;

public class JsonTest {
    public static void main(String[] args) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        String json = mapper.writeValueAsString(new RegisterRequest("hello", "world"));
        System.out.println(json);
    }
}

