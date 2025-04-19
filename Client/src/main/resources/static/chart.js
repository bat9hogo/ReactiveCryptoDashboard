// prices.js
// Перед этим скриптом в HTML подключите:
// <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

document.addEventListener("DOMContentLoaded", () => {
    // Проверяем JWT-токен
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
        alert("Вы не авторизованы! Перенаправление на страницу входа.");
        window.location.href = "login.html";
        return;
    }

    // Элементы DOM
    const logoutBtn = document.getElementById("logoutBtn");
    const dropdownBtn = document.querySelector(".dropdown-btn");
    const tokenDropdown = document.getElementById("tokenDropdown");
    const chartsContainer = document.getElementById("charts");
    const tablesContainer = document.getElementById("tablesContainer");

    // Логика выпадающего меню
    let hideTimeout;
    const showDropdown = () => { clearTimeout(hideTimeout); tokenDropdown.style.display = "block"; };
    const hideDropdown = () => { hideTimeout = setTimeout(() => tokenDropdown.style.display = "none", 300); };
    dropdownBtn.addEventListener("mouseenter", showDropdown);
    dropdownBtn.addEventListener("mouseleave", hideDropdown);
    tokenDropdown.addEventListener("mouseenter", showDropdown);
    tokenDropdown.addEventListener("mouseleave", hideDropdown);

    // Logout
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("jwtToken");
        window.location.href = "login.html";
    });

    // Состояние приложения
    const selectedTokens = new Set();         // e.g. "BTCUSDT"
    const priceDataMap = {};                  // symbol -> [{ time, price }, ...]
    let chartsMap = {};                       // symbol -> Chart instance
    let combinedChart = null;
    let isCombined = false;

    // Кнопка объединения графиков
    const combineBtn = document.createElement("button");
    combineBtn.textContent = "Объединить на одном графике";
    combineBtn.style.marginLeft = "10px";
    combineBtn.style.display = "none";
    dropdownBtn.parentNode.appendChild(combineBtn);
    combineBtn.addEventListener("click", () => {
        isCombined = !isCombined;
        combineBtn.textContent = isCombined ? "Вернуть по отдельности" : "Объединить на одном графике";
        renderCharts();
    });

    // WebSocket
    const socket = new WebSocket("ws://localhost:8080/ws/prices");
    socket.onopen = () => console.log("WebSocket подключён");
    socket.onerror = err => console.error("WebSocket ошибка:", err);
    socket.onclose = () => console.log("WebSocket закрыт");

    socket.onmessage = event => {
        try {
            const data = JSON.parse(event.data);
            const { symbol, price } = data;
            // Игнорируем неподписанные символы
            if (!selectedTokens.has(symbol)) return;

            // Добавляем новую запись
            const entry = { time: new Date().toLocaleTimeString(), price };
            priceDataMap[symbol] = priceDataMap[symbol] || [];
            priceDataMap[symbol].unshift(entry);
            if (priceDataMap[symbol].length > 20) priceDataMap[symbol].pop();

            renderTables();
            renderCharts();
        } catch (e) {
            console.error("Ошибка обработки WS сообщения:", e);
        }
    };

    // Обработчик чекбоксов токенов
    tokenDropdown.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            const base = checkbox.value;              // "BTC" или "ETH"
            const symbol = base + "USDT";           // формат сервера
            if (checkbox.checked) {
                selectedTokens.add(symbol);
                priceDataMap[symbol] = priceDataMap[symbol] || [];
                socket.send(symbol);                // подписываемся на поток
            } else {
                selectedTokens.delete(symbol);
                delete priceDataMap[symbol];
                if (chartsMap[symbol]) {
                    chartsMap[symbol].destroy();
                    delete chartsMap[symbol];
                }
            }
            // Показываем/убираем кнопку объединения
            if (selectedTokens.size === 2) {
                combineBtn.style.display = "inline-block";
            } else {
                combineBtn.style.display = "none";
                isCombined = false;
            }
            renderTables();
            renderCharts();
        });
    });

    // Очистка таблиц и графиков
    function clearTables() {
        tablesContainer.innerHTML = "";
    }
    function clearCharts() {
        chartsContainer.innerHTML = "";
        Object.values(chartsMap).forEach(chart => chart.destroy());
        chartsMap = {};
        if (combinedChart) { combinedChart.destroy(); combinedChart = null; }
    }

    // Отрисовка таблиц
    function renderTables() {
        clearTables();
        for (const symbol of selectedTokens) {
            const rows = priceDataMap[symbol] || [];
            const table = document.createElement("table");
            table.className = "price-table";
            const thead = document.createElement("thead");
            thead.innerHTML = `
                <tr>
                    <th>${symbol}</th>
                    <th>Цена</th>
                    <th>Время</th>
                </tr>
            `;
            table.appendChild(thead);

            const tbody = document.createElement("tbody");
            if (rows.length === 0) {
                const tr = document.createElement("tr");
                tr.innerHTML = `<td colspan="3" style="text-align:center;">Нет данных</td>`;
                tbody.appendChild(tr);
            } else {
                rows.forEach(entry => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${symbol}</td>
                        <td>${entry.price}</td>
                        <td>${entry.time}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }
            table.appendChild(tbody);
            tablesContainer.appendChild(table);
        }
    }

    // Отрисовка графиков
    function renderCharts() {
        clearCharts();
        const tokens = Array.from(selectedTokens);
        if (tokens.length === 0) return;

        if (isCombined && tokens.length === 2) {
            const canvas = document.createElement("canvas");
            chartsContainer.appendChild(canvas);
            const datasets = tokens.map(sym => ({
                label: sym,
                data: priceDataMap[sym].slice().reverse().map(r => ({ x: r.time, y: r.price })),
                fill: false
            }));
            combinedChart = new Chart(canvas.getContext("2d"), {
                type: 'line',
                data: { datasets },
                options: {
                    scales: {
                        x: { type: 'category', title: { display: true, text: 'Время' } },
                        y: { title: { display: true, text: 'Цена' } }
                    }
                }
            });
        } else {
            tokens.forEach(sym => {
                const canvas = document.createElement("canvas");
                chartsContainer.appendChild(canvas);
                const data = priceDataMap[sym].slice().reverse().map(r => ({ x: r.time, y: r.price }));
                chartsMap[sym] = new Chart(canvas.getContext("2d"), {
                    type: 'line',
                    data: { datasets: [{ label: sym, data, fill: false }] },
                    options: {
                        scales: {
                            x: { type: 'category', title: { display: true, text: 'Время' } },
                            y: { title: { display: true, text: 'Цена' } }
                        }
                    }
                });
            });
        }
    }
});
