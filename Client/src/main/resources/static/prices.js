document.addEventListener("DOMContentLoaded", () => {
    const jwtToken = localStorage.getItem("jwtToken");
    const tableBody = document.getElementById("priceTableBody");
    const logoutBtn = document.getElementById("logoutBtn");

    if (!jwtToken) {
        alert("Вы не авторизованы! Перенаправление на страницу входа.");
        window.location.href = "login.html";
        return;
    }

    const socket = new WebSocket("ws://localhost:8080/ws/prices");

    const priceData = {
        labels: [],
        datasets: [{
            label: 'Цена криптовалюты',
            data: [],
            borderColor: 'rgba(0, 123, 255, 1)',
            backgroundColor: 'rgba(0, 123, 255, 0.2)',
            fill: true,
            borderWidth: 2
        }]
    };

    const volumeData = {
        labels: [],
        datasets: [{
            label: 'Объем торговли',
            data: [],
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: true,
            borderWidth: 2
        }]
    };

    const ctxPrice = document.getElementById("cryptoPriceChart").getContext('2d');
    const ctxVolume = document.getElementById("volumeChart").getContext('2d');

    const priceChart = new Chart(ctxPrice, {
        type: 'line',
        data: priceData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom'
                }
            }
        }
    });

    const volumeChart = new Chart(ctxVolume, {
        type: 'line',
        data: volumeData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom'
                }
            }
        }
    });

    socket.onopen = () => {
        console.log("WebSocket соединение установлено");
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        // Добавляем новые данные на график
        priceData.labels.push(new Date().toLocaleTimeString());
        priceData.datasets[0].data.push(data.price);
        volumeData.labels.push(new Date().toLocaleTimeString());
        volumeData.datasets[0].data.push(data.volume);

        priceChart.update();
        volumeChart.update();

        // Обновляем таблицу
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
        window.location.href = "login.html";
    });
});
