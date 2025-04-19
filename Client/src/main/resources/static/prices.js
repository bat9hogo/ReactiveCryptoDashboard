document.addEventListener("DOMContentLoaded", () => {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
        alert("Вы не авторизованы! Перенаправление на страницу входа.");
        window.location.href = "login.html";
        return;
    }

    const logoutBtn = document.getElementById("logoutBtn");
    const dropdownBtn = document.querySelector(".dropdown-btn");
    const tokenDropdown = document.getElementById("tokenDropdown");
    const tablesContainer = document.getElementById("tablesContainer");
    const chart1 = document.getElementById("chart1").getContext("2d");
    const chart2 = document.getElementById("chart2").getContext("2d");

    let chartInstance1 = null;
    let chartInstance2 = null;
    let combinedChart = null;
    let isCombined = false;

    const selectedTokens = new Set();
    const priceDataMap = {};
    const chartsData = {}; // symbol -> Chart.js instance

    // Dropdown поведение
    let hideTimeout;
    const showDropdown = () => {
        clearTimeout(hideTimeout);
        tokenDropdown.style.display = "block";
    };
    const hideDropdown = () => {
        hideTimeout = setTimeout(() => {
            tokenDropdown.style.display = "none";
        }, 300);
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

    // Кнопка объединения
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

    // WebSocket подключение
    const socket = new WebSocket("ws://localhost:8080/ws/prices");
    socket.onmessage = event => {
        try {
            const { symbol, price } = JSON.parse(event.data);
            if (!selectedTokens.has(symbol)) return;
            const time = new Date().toLocaleTimeString();
            priceDataMap[symbol] = priceDataMap[symbol] || [];
            priceDataMap[symbol].unshift({ time, price });
            if (priceDataMap[symbol].length > 20) priceDataMap[symbol].pop();
            renderTables();
            renderCharts();
        } catch (e) {
            console.error("Ошибка обработки данных:", e);
        }
    };

    // Обработка чекбоксов токенов
    tokenDropdown.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            const symbol = checkbox.value + "USDT";
            if (checkbox.checked) {
                selectedTokens.add(symbol);
                priceDataMap[symbol] = priceDataMap[symbol] || [];
                socket.send(symbol);
            } else {
                selectedTokens.delete(symbol);
                delete priceDataMap[symbol];
                if (chartsData[symbol]) {
                    chartsData[symbol].destroy();
                    chartsData[symbol] = null;
                }
            }

            // Обновить состояние кнопки
            combineBtn.style.display = selectedTokens.size === 2 ? "inline-block" : "none";
            if (selectedTokens.size < 2) isCombined = false;

            renderTables();
            renderCharts();
        });
    });

    function renderTables() {
        tablesContainer.innerHTML = "";
        if (selectedTokens.size === 0) return;

        selectedTokens.forEach(symbol => {
            const table = document.createElement("table");
            table.className = "price-table";
            const thead = document.createElement("thead");
            thead.innerHTML = `<tr><th>${symbol}</th><th>Цена</th><th>Время</th></tr>`;
            const tbody = document.createElement("tbody");

            const rows = priceDataMap[symbol] || [];
            if (rows.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Нет данных</td></tr>`;
            } else {
                rows.forEach(({ price, time }) => {
                    const row = `<tr><td>${symbol}</td><td>${price}</td><td>${time}</td></tr>`;
                    tbody.innerHTML += row;
                });
            }

            table.appendChild(thead);
            table.appendChild(tbody);
            tablesContainer.appendChild(table);
        });
    }

    function renderCharts() {
        const symbols = Array.from(selectedTokens);

        // Очистка старых графиков
        if (chartInstance1) chartInstance1.destroy();
        if (chartInstance2) chartInstance2.destroy();
        if (combinedChart) combinedChart.destroy();

        if (symbols.length === 0) return;

        if (isCombined && symbols.length === 2) {
            const datasets = symbols.map(sym => ({
                label: sym,
                data: priceDataMap[sym].slice().reverse().map(p => ({ x: p.time, y: p.price })),
                fill: false
            }));
            combinedChart = new Chart(chart1, {
                type: "line",
                data: { datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { type: "category", title: { display: true, text: "Время" } },
                        y: { title: { display: true, text: "Цена" } }
                    }
                }
            });
            chart2.canvas.parentNode.style.display = "none";
        } else {
            chart2.canvas.parentNode.style.display = symbols.length === 2 ? "block" : "none";
            const chartTargets = [chart1, chart2];
            symbols.forEach((sym, idx) => {
                const ctx = chartTargets[idx];
                const data = priceDataMap[sym].slice().reverse().map(p => ({ x: p.time, y: p.price }));
                const chart = new Chart(ctx, {
                    type: "line",
                    data: {
                        datasets: [{
                            label: sym,
                            data,
                            fill: false
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: { type: "category", title: { display: true, text: "Время" } },
                            y: { title: { display: true, text: "Цена" } }
                        }
                    }
                });
                if (idx === 0) chartInstance1 = chart;
                else chartInstance2 = chart;
            });
        }
    }
});
