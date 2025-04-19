// prices.js
document.addEventListener("DOMContentLoaded", () => {
    // проверка токена
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
        alert("Вы не авторизованы! Перенаправление на вход.");
        return window.location.href = "login.html";
    }

    // элементы
    const logoutBtn = document.getElementById("logoutBtn");
    const dropdownBtn = document.querySelector(".dropdown-btn");
    const tokenDropdown = document.getElementById("tokenDropdown");
    const tablesContainer = document.getElementById("tablesContainer");
    const chart1 = document.getElementById("chart1").getContext("2d");
    const chart2 = document.getElementById("chart2").getContext("2d");
    const filterModal = document.getElementById("filterModal");
    const closeFilter = document.getElementById("closeFilter");
    const applyFilterBtn = document.getElementById("applyFilterBtn");
    const resetFilterBtn = document.getElementById("resetFilterBtn");

    // состояния
    let chartInstance1 = null, chartInstance2 = null;
    let isCombined = false;
    const selectedTokens = new Set();
    const priceDataMap = {};
    const filterSettings = {};  // symbol -> {minPrice,maxPrice,startTime,endTime}

    // logout
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("jwtToken");
        window.location.href = "login.html";
    });

    // WebSocket
    const socket = new WebSocket("ws://localhost:8080/ws/prices");
    socket.onmessage = e => {
        const data = JSON.parse(e.data);

        // Если это алерт — сразу показать всплывающее окно
        if (data.type === 'alert') {
            const {symbol, change, price} = data;
            showAlertPopup(symbol, change,price);
            return;
        }

        // Иначе — обычное обновление цены
        const {symbol, price} = data;
        if (!selectedTokens.has(symbol)) return;

        const time = new Date().toLocaleTimeString();
        priceDataMap[symbol] = priceDataMap[symbol] || [];

        if (!priceDataMap[symbol].length || priceDataMap[symbol][0].time !== time) {
            priceDataMap[symbol].unshift({time, price});
            if (priceDataMap[symbol].length > 300) {
                priceDataMap[symbol].pop();
            }
        }

        renderTables();
        renderCharts();
    };


    // кнопка «Объединить»
    const combineBtn = document.createElement("button");
    combineBtn.className = "combine-btn";
    combineBtn.textContent = "Объединить на одном графике";
    combineBtn.style.display = "none";  // скрываем изначально
    dropdownBtn.parentNode.appendChild(combineBtn);
    combineBtn.addEventListener("click", () => {
        isCombined = !isCombined;
        combineBtn.textContent = isCombined
            ? "Вернуть по отдельности"
            : "Объединить на одном графике";
        renderCharts();
    });

    // dropdown токенов
    let hideTimeout;
    const showDD = ()=>{ clearTimeout(hideTimeout); tokenDropdown.style.display="flex"; };
    const hideDD = ()=>{ hideTimeout=setTimeout(()=> tokenDropdown.style.display="none",300); };
    dropdownBtn.addEventListener("mouseenter", showDD);
    tokenDropdown.addEventListener("mouseenter", showDD);
    dropdownBtn.addEventListener("mouseleave", hideDD);
    tokenDropdown.addEventListener("mouseleave", hideDD);

    // чекбоксы токенов
    tokenDropdown.querySelectorAll("input[type=checkbox]").forEach(cb => {
        cb.addEventListener("change", () => {
            const sym = cb.value + "USDT";
            if (cb.checked) {
                selectedTokens.add(sym);
                priceDataMap[sym]=priceDataMap[sym]||[];
                filterSettings[sym]={};
                socket.send(sym);
            } else {
                selectedTokens.delete(sym);
                delete priceDataMap[sym];
                delete filterSettings[sym];
                isCombined = selectedTokens.size===2 && isCombined;
            }
            // показываем «объединить» только при ровно 2
            combineBtn.style.display = selectedTokens.size===2 ? "inline-block" : "none";
            renderTables();
            renderCharts();
        });
    });

    // открыть/закрыть модалку
    let currentFilterSymbol = null;
    closeFilter.onclick = ()=> filterModal.style.display="none";

    // Применить из модалки
    applyFilterBtn.addEventListener("click", () => {
        if (!currentFilterSymbol) return;
        const s = filterSettings[currentFilterSymbol] = {
            minPrice:   parseFloat(document.getElementById("minPrice").value)   || null,
            maxPrice:   parseFloat(document.getElementById("maxPrice").value)   || null,
            startTime:  document.getElementById("minTime" in document? "minTime":"minTime")  .value|| null,
            endTime:    document.getElementById("maxTime").value                || null
        };
        filterModal.style.display="none";
        renderTables();
        renderCharts();
    });

    // Сброс из модалки
    resetFilterBtn.addEventListener("click", () => {
        ["minTime","maxTime","minPrice","maxPrice"].forEach(id=>document.getElementById(id).value="");
    });

    // рендер таблиц
    function renderTables() {
        tablesContainer.innerHTML="";
        selectedTokens.forEach(sym=>{
            // обёртка
            const wrap = document.createElement("div");
            wrap.className = "table-wrapper";
            wrap.dataset.sym = sym;

            // кнопка фильтрация
            const btn = document.createElement("button");
            btn.className = "filter-btn";
            btn.textContent = "Фильтр";
            btn.onclick = ()=>{
                currentFilterSymbol = sym;
                // заполняем поля текущим состоянием
                const fs = filterSettings[sym]||{};
                document.getElementById("minTime").value = fs.startTime||"";
                document.getElementById("maxTime").value = fs.endTime  ||"";
                document.getElementById("minPrice").value= fs.minPrice||"";
                document.getElementById("maxPrice").value= fs.maxPrice||"";
                filterModal.style.display="block";
            };
            wrap.appendChild(btn);

            // таблица
            const tbl = document.createElement("table");
            tbl.className = "price-table";
            tbl.innerHTML = `
        <thead><tr><th>${sym}</th><th>Цена</th><th>Время</th></tr></thead>
        <tbody>
        ${applyFilter(sym, priceDataMap[sym]||[])
                .map(d=>`<tr><td>${sym}</td><td>${d.price}</td><td>${d.time}</td></tr>`)
                .join("") ||
            `<tr><td colspan="3" style="text-align:center">Нет данных</td></tr>`
            }
        </tbody>`;
            wrap.appendChild(tbl);
            tablesContainer.appendChild(wrap);
        });
    }

    // рендер графиков
    function renderCharts() {
        const syms = [...selectedTokens];
        if (chartInstance1) chartInstance1.destroy();
        if (chartInstance2) chartInstance2.destroy();
        if (!syms.length) return;

        // объединённый
        if (syms.length===2 && isCombined) {
            const allData = syms.map((sym,i)=>({
                label: sym,
                data: applyFilter(sym, priceDataMap[sym]||[])
                    .slice().reverse()
                    .map(p=>({x:p.time,y:p.price}))
            }));
            chart1.canvas.parentNode.style.display="block";
            chart2.canvas.parentNode.style.display="none";
            chartInstance1 = new Chart(chart1, {
                type:"line", data:{datasets: allData},
                options:{responsive:true, maintainAspectRatio:false}
            });
            return;
        }

        // по отдельности
        syms.forEach((sym,i)=>{
            const data = applyFilter(sym, priceDataMap[sym]||[])
                .slice().reverse()
                .map(p=>({x:p.time,y:p.price}));
            const ctx = i===0 ? chart1 : chart2;
            const wrapper = ctx.canvas.parentNode;
            wrapper.style.display="block";
            if (i===1 || syms.length===1) {
                // второй график скроем, если один
                if (syms.length===1) document.getElementById("chart2-wrapper").style.display="none";
            }
            const cfg = {
                type:"line",
                data:{datasets:[{label:sym,data}]},
                options:{
                    responsive:true,
                    maintainAspectRatio:false,
                    scales:{
                        x:{type:"category", title:{display:true,text:"Время"}},
                        y:{title:{display:true,text:"Цена"}}
                    }
                }
            };
            if (i===0) chartInstance1 = new Chart(ctx,cfg);
            else       chartInstance2 = new Chart(ctx,cfg);
        });
    }

    // фильтрация по времени и цене
    function applyFilter(sym, arr) {
        const {minPrice, maxPrice, startTime, endTime} = filterSettings[sym]||{};
        return (arr||[]).filter(d => {
            let ok = true;
            if (minPrice!=null && d.price < minPrice) ok = false;
            if (maxPrice!=null && d.price > maxPrice) ok = false;
            // парсим только время
            const t = moment(d.time, 'h:mm:ss A');
            if (startTime && !t.isSameOrAfter(moment(startTime, 'HH:mm'))) ok = false;
            if (endTime   && !t.isSameOrBefore (moment(endTime,   'HH:mm'))) ok = false;
            return ok;
        });
    }



    // initial
    renderTables();
    renderCharts();
});
