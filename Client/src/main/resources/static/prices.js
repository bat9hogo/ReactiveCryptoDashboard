document.addEventListener("DOMContentLoaded", () => {
    const jwtToken = localStorage.getItem("jwtToken");
    const tableBody = document.getElementById("priceTableBody");
    const logoutBtn = document.getElementById("logoutBtn");

    if (!jwtToken) {
        alert("Вы не авторизованы! Перенаправление на страницу входа.");
        window.location.href = "index.html";
        return;
    }

    const socket = new WebSocket("ws://localhost:8080/ws/prices");

    socket.onopen = () => {
        console.log("WebSocket соединение установлено");
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const row = document.createElement("tr");

        const symbolCell = document.createElement("td");
        symbolCell.textContent = data.symbol;

        const priceCell = document.createElement("td");
        priceCell.textContent = data.price;

        const timeCell = document.createElement("td");
        timeCell.textContent = new Date().toLocaleTimeString();

        row.appendChild(symbolCell);
        row.appendChild(priceCell);
        row.appendChild(timeCell);

        tableBody.prepend(row);

        if (tableBody.rows.length > 20) {
            tableBody.deleteRow(-1);
        }
    };

    socket.onerror = (error) => {
        console.error("Ошибка WebSocket:", error);
    };

    socket.onclose = () => {
        console.log("WebSocket соединение закрыто");
    };

    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("jwtToken");
        window.location.href = "index.html";
    });
});
