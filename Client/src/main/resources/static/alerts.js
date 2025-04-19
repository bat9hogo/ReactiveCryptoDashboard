let alertHistory = [];

// Создаём контейнер для алертов (если ещё нет)
let alertsContainer = document.getElementById("alerts-container");
if (!alertsContainer) {
    alertsContainer = document.createElement("div");
    alertsContainer.id = "alerts-container";
    alertsContainer.style.position = "fixed";
    alertsContainer.style.bottom = "20px";
    alertsContainer.style.right = "20px";
    alertsContainer.style.display = "flex";
    alertsContainer.style.flexDirection = "column-reverse";
    alertsContainer.style.gap = "10px";
    alertsContainer.style.zIndex = "10000";
    document.body.appendChild(alertsContainer);
}

// Показ алерта
function showAlertPopup(symbol, change, price) {
    if (change === undefined || price === undefined) {
        console.warn('Alert skipped: missing change or price');
        return;
    }

    const alertBox = document.createElement('div');
    const direction = change > 0 ? 'up' : 'down';
    alertBox.className = `alert-popup alert-popup-${direction}`;
    alertBox.innerHTML = `
        <span class="arrow">${direction === 'up' ? '↑' : '↓'}</span>
        ${symbol}: изменение ${change > 0 ? '+' : ''}${change.toFixed(3)}%
        <span class="price">(${price})</span>
    `;

    alertsContainer.appendChild(alertBox);

    // Добавляем в историю
    alertHistory.push({
        symbol,
        change,
        price,
        time: new Date().toLocaleString()
    });

    updateAlertHistory();

    // Плавное исчезновение
    setTimeout(() => {
        alertBox.style.opacity = '0';
        setTimeout(() => alertBox.remove(), 500);
    }, 5000);
}

// Кнопка показа истории
function showAlertHistory() {
    const historyContainer = document.querySelector('.alert-history-container');
    historyContainer.style.display = historyContainer.style.display === 'block' ? 'none' : 'block';
}

// Обновить историю
function updateAlertHistory() {
    const historyContainer = document.querySelector('.alert-history-container');
    historyContainer.innerHTML = '';

    alertHistory.forEach(alert => {
        const entry = document.createElement('div');
        entry.className = 'alert-history-entry';
        entry.innerHTML = `
            ${alert.symbol}: изменение ${alert.change > 0 ? '+' : ''}${alert.change.toFixed(2)}%
            <span class="time">(${alert.time})</span>
            <span class="price">Цена: ${alert.price}</span>
        `;
        historyContainer.appendChild(entry);
    });
}

// Обработчик кнопки истории
document.querySelector('.alert-history-button')?.addEventListener('click', showAlertHistory);
