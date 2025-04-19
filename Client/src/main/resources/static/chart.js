document.addEventListener("DOMContentLoaded", () => {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
        alert("Вы не авторизованы! Перенаправление на страницу входа.");
        return window.location.href = "login.html";
    }

    const logoutBtn = document.getElementById("logoutBtn");
    const dropdownBtn = document.querySelector(".dropdown-btn");
    const tokenDropdown = document.getElementById("tokenDropdown");
    const chartsContainer = document.getElementById("charts");
    const tablesContainer = document.getElementById("tablesContainer");

    let hideTimeout;
    const showDropdown = () => { clearTimeout(hideTimeout); tokenDropdown.style.display = "block"; };
    const hideDropdown = () => { hideTimeout = setTimeout(() => tokenDropdown.style.display = "none", 300); };
    dropdownBtn.addEventListener("mouseenter", showDropdown);
    dropdownBtn.addEventListener("mouseleave", hideDropdown);
    tokenDropdown.addEventListener("mouseenter", showDropdown);
    tokenDropdown.addEventListener("mouseleave", hideDropdown);

    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("jwtToken");
        window.location.href = "login.html";
    });

    const selectedTokens = new Set();
    const priceDataMap = {};
    let chartsMap = {};
    let combinedChart = null;
    let isCombined = false;

    const combineBtn = document.createElement("button");
    combineBtn.id = "combineBtn";
    combineBtn.textContent = "Объединить на одном графике";
    combineBtn.style.display = "none";
    dropdownBtn.parentNode.appendChild(combineBtn);
    combineBtn.addEventListener("click", () => {
        isCombined = !isCombined;
        combineBtn.textContent = isCombined ? "Вернуть по отдельности" : "Объединить на одном графике";
        renderCharts();
    });

    const socket = new WebSocket("ws://localhost:8080/ws/prices");
    socket.onopen = () => console.log("WebSocket подключён");
    socket.onerror = err => console.error("WebSocket ошибка:", err);
    socket.onclose = () => console.log("WebSocket закрыт");

    socket.onmessage = ({ data: msg }) => {
        try {
            const { symbol, price } = JSON.parse(msg);
            if (!selectedTokens.has(symbol)) return;

            const now = moment();
            const entry = { timestamp: now.valueOf(), time: now.format("HH:mm:ss"), price };
            priceDataMap[symbol] = priceDataMap[symbol] || [];
            priceDataMap[symbol].unshift(entry);
            if (priceDataMap[symbol].length > 300) {
                priceDataMap[symbol].pop();
            }

            renderTables();
            renderCharts();
        } catch (e) {
            console.error("Ошибка обработки WS сообщения:", e);
        }
    };

    tokenDropdown.querySelectorAll("input[type='checkbox']").forEach(cb => {
        cb.addEventListener("change", () => {
            const symbol = cb.value + "USDT";
            if (cb.checked) {
                selectedTokens.add(symbol);
                priceDataMap[symbol] = priceDataMap[symbol] || [];
                socket.send(symbol);
            } else {
                selectedTokens.delete(symbol);
                delete priceDataMap[symbol];
                if (chartsMap[symbol]) {
                    chartsMap[symbol].destroy();
                    delete chartsMap[symbol];
                }
            }
            combineBtn.style.display = selectedTokens.size === 2 ? "inline-block" : "none";
            if (selectedTokens.size !== 2) isCombined = false;
            renderTables();
            renderCharts();
        });
    });

    function clearTables() {
        tablesContainer.innerHTML = "";
    }

    function clearCharts() {
        Object.values(chartsMap).forEach(c => c.destroy());
        chartsMap = {};
        if (combinedChart) {
            combinedChart.destroy();
            combinedChart = null;
        }
        chartsContainer.innerHTML = "";
    }

    function renderTables() {
        clearTables();
        if (!selectedTokens.size) return;
        selectedTokens.forEach(symbol => {
            const rows = priceDataMap[symbol] || [];
            const table = document.createElement("table");
            table.className = "price-table";
            const thead = document.createElement("thead");
            thead.innerHTML = `<tr><th>${symbol}</th><th>Цена</th><th>Время</th></tr>`;
            table.appendChild(thead);

            const tbody = document.createElement("tbody");
            if (!rows.length) {
                tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Нет данных</td></tr>`;
            } else {
                rows.forEach(r => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `<td>${symbol}</td><td>${r.price}</td><td>${r.time}</td>`;
                    tbody.appendChild(tr);
                });
            }
            table.appendChild(tbody);
            tablesContainer.appendChild(table);
        });
    }

    function renderCharts() {
        clearCharts();
        const tokens = Array.from(selectedTokens);
        if (!tokens.length) return;

        const allT = tokens.flatMap(sym => (priceDataMap[sym] || []).map(r => r.timestamp)).sort((a, b) => a - b);
        const minTime = allT[0], maxTime = allT[allT.length - 1];

        const baseOptions = {
            parsing: false,
            animation: false,
            responsive: false,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: { unit: 'second' },
                    min: minTime,
                    max: maxTime,
                    title: { display: true, text: 'Время' }
                },
                y: {
                    title: { display: true, text: 'Цена' }
                }
            },
            zoom: {
                enabled: true,
                mode: 'xy'
            }
        };

        if (isCombined && tokens.length === 2) {
            const canvas = document.createElement("canvas");
            canvas.className = "combined-chart";
            chartsContainer.appendChild(canvas);
            applyCanvasSize(canvas);

            const datasets = tokens.map(sym => ({
                label: sym,
                data: priceDataMap[sym].slice().reverse().map(r => ({ x: r.timestamp, y: r.price })),
                fill: false
            }));
            combinedChart = new Chart(canvas.getContext("2d"), {
                type: 'line',
                data: { datasets },
                options: baseOptions
            });

        } else {
            tokens.forEach(sym => {
                const canvas = document.createElement("canvas");
                canvas.className = "single-chart";
                chartsContainer.appendChild(canvas);
                applyCanvasSize(canvas);

                const data = priceDataMap[sym].slice().reverse().map(r => ({ x: r.timestamp, y: r.price }));
                chartsMap[sym] = new Chart(canvas.getContext("2d"), {
                    type: 'line',
                    data: { datasets: [{ label: sym, data, fill: false }] },
                    options: baseOptions
                });
            });
        }
    }

    function applyCanvasSize(canvas) {
        const cs = getComputedStyle(canvas);
        canvas.width = parseFloat(cs.width);
        canvas.height = parseFloat(cs.height);
    }
});
