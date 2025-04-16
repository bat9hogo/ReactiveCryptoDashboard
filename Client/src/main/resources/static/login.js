document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const loginError = document.getElementById("loginError");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        loginError.textContent = "";

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!username || !password) {
            loginError.textContent = "Введите логин и пароль";
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("jwtToken", data.token);
                window.location.href = "prices.html";
            } else {
                const errorText = await response.text();
                if (errorText.includes("Invalid credentials") ||
                    errorText.includes("Bad credentials")) {
                    loginError.textContent = "Неверный пароль";
                } else {
                    loginError.textContent = "Ошибка входа: " + errorText;
                }
            }
        } catch (err) {
            loginError.textContent = "Ошибка соединения с сервером";
            console.error(err);
        }
    });
});
