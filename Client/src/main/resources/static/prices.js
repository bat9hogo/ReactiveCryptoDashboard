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
    const filterBoxOpen = {}; // symbol -> true/false

    let chartInstance1 = null;
    let chartInstance2 = null;
    let isCombined = false;
    const selectedTokens = new Set();
    const priceDataMap = {};
    const filterSettings = {}; // symbol -> { minPrice, maxPrice, startTime, endTime }

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

    // WebSocket
    const socket = new WebSocket("ws://localhost:8080/ws/prices");
    socket.onmessage = event => {
        try {
            const { symbol, price } = JSON.parse(event.data);
            if (!selectedTokens.has(symbol)) return;
            const time = new Date().toLocaleTimeString();
            priceDataMap[symbol] = priceDataMap[symbol] || [];
            priceDataMap[symbol].unshift({ time, price });
            if (priceDataMap[symbol].length > 300) priceDataMap[symbol].pop();
            renderTables();
            renderCharts();
        } catch (e) {
            console.error("Ошибка обработки данных:", e);
        }
    };

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

    // Обработка чекбоксов
    tokenDropdown.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            const symbol = checkbox.value + "USDT";
            if (checkbox.checked) {
                selectedTokens.add(symbol);
                priceDataMap[symbol] = priceDataMap[symbol] || [];
                filterSettings[symbol] = {}; // по умолчанию пустой фильтр
                socket.send(symbol);
            } else {
                selectedTokens.delete(symbol);
                delete priceDataMap[symbol];
                delete filterSettings[symbol];
                if (selectedTokens.size < 2) isCombined = false;
            }

            combineBtn.style.display = selectedTokens.size === 2 ? "inline-block" : "none";
            renderFilters();  // Вызываем обновление фильтров
            renderTables();
            renderCharts();
        });
    });

    // Функция для рендеринга фильтров
    function renderFilters() {
        const filtersContainer = document.getElementById("filtersContainer");
        filtersContainer.innerHTML = ""; // очищаем контейнер фильтров

        selectedTokens.forEach(symbol => {
            const filterBox = document.createElement("div");
            filterBox.className = "filter-box";
            filterBox.innerHTML = `
            <label>Мин. цена: <input type="number" id="minPrice-${symbol}" step="0.01" value="${filterSettings[symbol]?.minPrice ?? ""}"></label><br>
            <label>Макс. цена: <input type="number" id="maxPrice-${symbol}" step="0.01" value="${filterSettings[symbol]?.maxPrice ?? ""}"></label><br>
            <label>От (время): <input type="time" id="startTime-${symbol}" value="${filterSettings[symbol]?.startTime ?? ""}"></label><br>
            <label>До (время): <input type="time" id="endTime-${symbol}" value="${filterSettings[symbol]?.endTime ?? ""}"></label><br>
            <button id="applyFilter-${symbol}">Применить</button>
        `;
            filtersContainer.appendChild(filterBox);

            document.getElementById(`applyFilter-${symbol}`).addEventListener("click", () => {
                const minPrice = parseFloat(document.getElementById(`minPrice-${symbol}`).value) || null;
                const maxPrice = parseFloat(document.getElementById(`maxPrice-${symbol}`).value) || null;
                const startTime = document.getElementById(`startTime-${symbol}`).value || null;
                const endTime = document.getElementById(`endTime-${symbol}`).value || null;

                filterSettings[symbol] = { minPrice, maxPrice, startTime, endTime };
                renderTables();
                renderCharts();
            });
        });
    }


    // Рендеринг таблиц
    function renderTables() {
        tablesContainer.innerHTML = "";
        if (selectedTokens.size === 0) return;

        selectedTokens.forEach(symbol => {
            const container = document.createElement("div");
            container.style.position = "relative";

            const table = document.createElement("table");
            table.className = "price-table";
            const thead = document.createElement("thead");
            thead.innerHTML = `<tr><th>${symbol}</th><th>Цена</th><th>Время</th></tr>`;
            const tbody = document.createElement("tbody");

            const rows = applyFilter(symbol, priceDataMap[symbol] || []);
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
            container.appendChild(table);
            tablesContainer.appendChild(container);
        });
    }

    // Рендеринг графиков
    function renderCharts() {
        const symbols = Array.from(selectedTokens);
        if (chartInstance1) chartInstance1.destroy();
        if (chartInstance2) chartInstance2.destroy();

        if (symbols.length === 0) return;

        if (symbols.length === 1) {
            // Для одного токена отрисовываем график только для него
            const data = applyFilter(symbols[0], priceDataMap[symbols[0]]).slice().reverse().map(p => ({ x: p.time, y: p.price }));
            chart1.canvas.parentNode.style.display = "block";
            chart2.canvas.parentNode.style.display = "none";
            chartInstance1 = new Chart(chart1, {
                type: "line",
                data: { datasets: [{ label: symbols[0], data }] },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { type: "category", title: { display: true, text: "Время" } },
                        y: { title: { display: true, text: "Цена" } }
                    }
                }
            });
        } else if (symbols.length === 2) {
            // Для двух токенов отрисовываем два графика
            const data1 = applyFilter(symbols[0], priceDataMap[symbols[0]]).slice().reverse().map(p => ({ x: p.time, y: p.price }));
            const data2 = applyFilter(symbols[1], priceDataMap[symbols[1]]).slice().reverse().map(p => ({ x: p.time, y: p.price }));

            chart1.canvas.parentNode.style.display = "block";
            chart2.canvas.parentNode.style.display = "block";

            chartInstance1 = new Chart(chart1, {
                type: "line",
                data: { datasets: [{ label: symbols[0], data: data1 }] },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { type: "category", title: { display: true, text: "Время" } },
                        y: { title: { display: true, text: "Цена" } }
                    }
                }
            });

            chartInstance2 = new Chart(chart2, {
                type: "line",
                data: { datasets: [{ label: symbols[1], data: data2 }] },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { type: "category", title: { display: true, text: "Время" } },
                        y: { title: { display: true, text: "Цена" } }
                    }
                }
            });
        }
    }

    // Применение фильтров
    function applyFilter(symbol, data) {
        const { minPrice, maxPrice, startTime, endTime } = filterSettings[symbol] || {};
        return data.filter(d => {
            let isValid = true;
            if (minPrice !== null && d.price < minPrice) isValid = false;
            if (maxPrice !== null && d.price > maxPrice) isValid = false;
            if (startTime && d.time < startTime) isValid = false;
            if (endTime && d.time > endTime) isValid = false;
            return isValid;
        });
    }

    // Отображение фильтров
    renderFilters();
    renderTables();
    renderCharts();
});
