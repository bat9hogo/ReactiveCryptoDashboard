document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
    const errorMessage = document.getElementById("errorMessage");
    const successMessage = document.getElementById("successMessage");

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        errorMessage.textContent = "";
        successMessage.textContent = "";

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();
        const confirmPassword = document.getElementById("confirmPassword").value.trim();

        if (!username || !password || !confirmPassword) {
            errorMessage.textContent = "Пожалуйста, заполните все поля.";
            return;
        }

        if (password.length <= 5 || !/[A-Za-z]/.test(password)) {
            errorMessage.textContent = "Пароль должен быть не менее 6 символов и содержать хотя бы одну букву.";
            return;
        }

        if (password !== confirmPassword) {
            errorMessage.textContent = "Пароли не совпадают.";
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                successMessage.textContent = "Регистрация прошла успешно! Перенаправление на страницу входа...";
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2000);
            } else {
                const errorText = await response.text();
                errorMessage.textContent = errorText;
            }
        } catch (err) {
            errorMessage.textContent = "Ошибка соединения с сервером.";
            console.error(err);
        }
    });
});
