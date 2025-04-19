document.addEventListener("DOMContentLoaded", () => {
    // Проверяем JWT-токен
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
        alert("Вы не авторизованы! Перенаправление на страницу входа.");
        window.location.href = "login.html";
        return;
    }

    // Элементы интерфейса
    const logoutBtn = document.getElementById("logoutBtn");
    const dropdownBtn = document.querySelector(".dropdown-btn");
    const tokenDropdown = document.getElementById("tokenDropdown");
    const chartsContainer = document.getElementById("charts");
    const tablesContainer = document.getElementById("tablesContainer");

    // Логика dropdown
    let hideTimeout;
    const showDropdown = () => {
        clearTimeout(hideTimeout);
        tokenDropdown.style.display = "block";
    };
    const hideDropdown = () => {
        hideTimeout = setTimeout(() => tokenDropdown.style.display = "none", 300);
    };
    dropdownBtn.addEventListener("mouseenter", showDropdown);
    dropdownBtn.addEventListener("mouseleave", hideDropdown);
    tokenDropdown.addEventListener("mouseenter", showDropdown);
    tokenDropdown.addEventListener("mouseleave", hideDropdown);

    // Logout
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("jwtToken");
        window.location.href = "login.html";
    });

    // Состояние выбранных токенов и данные
    const selectedTokens = new Set();             // хранит символы вида "BTCUSDT"
    const priceDataMap = {};                      // символ -> массив записей {symbol, price, time}

    // Открываем один WebSocket
    const socket = new WebSocket("ws://localhost:8080/ws/prices");
    socket.onopen = () => console.log("WebSocket подключён");
    socket.onerror = err => console.error("WebSocket ошибка:", err);
    socket.onclose = () => console.log("WebSocket закрыт");

    // Обработка входящих сообщений
    socket.onmessage = event => {
        try {
            const data = JSON.parse(event.data);
            // Проверяем данные
            if (!data.symbol || !data.price) return;
            const symbol = data.symbol;
            // Если не подписаны на этот токен — игнорируем
            if (!selectedTokens.has(symbol)) return;

            // Обновляем priceDataMap
            if (!priceDataMap[symbol]) priceDataMap[symbol] = [];
            priceDataMap[symbol].unshift({
                symbol,
                price: data.price,
                time: new Date().toLocaleTimeString()
            });
            if (priceDataMap[symbol].length > 20) priceDataMap[symbol].pop();

            // Обновляем таблицы
            renderTables();
        } catch (e) {
            console.error("Ошибка парсинга сообщения:", e);
        }
    };

    // Обработчики чекбоксов токенов
    tokenDropdown.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            const base = checkbox.value;                 // "BTC" или "ETH"
            const symbol = base + "USDT";             // переводим в формат сервера
            if (checkbox.checked) {
                selectedTokens.add(symbol);
                if (!priceDataMap[symbol]) priceDataMap[symbol] = [];
                socket.send(symbol);                    // подписываемся на streamPricesBySymbol
            } else {
                selectedTokens.delete(symbol);
                delete priceDataMap[symbol];
                // опционально можно отсылать отмену подписки
            }
            clearCharts();
            renderTables();
        });
    });

    // Функции очистки
    function clearTables() {
        tablesContainer.innerHTML = "";
    }
    function clearCharts() {
        chartsContainer.innerHTML = "";
    }

    // Отрисовка таблиц
    function renderTables() {
        clearTables();
        const tokens = Array.from(selectedTokens);
        if (tokens.length === 0) return;

        tokens.forEach(symbol => {
            const rows = priceDataMap[symbol] || [];
            const table = document.createElement("table");
            table.className = "price-table";

            // Заголовок
            const thead = document.createElement("thead");
            thead.innerHTML = `
                <tr>
                    <th>${symbol}</th>
                    <th>Цена</th>
                    <th>Время</th>
                </tr>
            `;
            table.appendChild(thead);

            // Тело таблицы
            const tbody = document.createElement("tbody");
            if (rows.length === 0) {
                const tr = document.createElement("tr");
                tr.innerHTML = `<td colspan=3 style=\"text-align:center;\">Нет данных</td>`;
                tbody.appendChild(tr);
            } else {
                rows.forEach(entry => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${entry.symbol}</td>
                        <td>${entry.price}</td>
                        <td>${entry.time}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }
            table.appendChild(tbody);
            tablesContainer.appendChild(table);
        });
    }
});
