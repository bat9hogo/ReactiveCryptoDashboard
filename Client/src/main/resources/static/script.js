document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");

    loginBtn.addEventListener("click", async () => {
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!username || !password) {
            alert("Введите логин и пароль");
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
                alert("Ошибка входа: " + errorText);
            }
        } catch (err) {
            alert("Ошибка соединения с сервером");
            console.error(err);
        }
    });

    registerBtn.addEventListener("click", async () => {
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!username || !password) {
            alert("Введите логин и пароль");
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                alert("Регистрация прошла успешно! Теперь вы можете войти.");
            } else {
                const errorText = await response.text();
                alert("Ошибка регистрации: " + errorText);
            }
        } catch (err) {
            alert("Ошибка соединения с сервером");
            console.error(err);
        }
    });
});
