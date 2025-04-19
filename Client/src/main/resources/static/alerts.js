let alertHistory = [];

// Создаём контейнер для алертов (если ещё нет)
let alertsContainer = document.getElementById("alerts-container");
if (!alertsContainer) {
    alertsContainer = document.createElement("div");
    alertsContainer.id = "alerts-container";
    alertsContainer.className = "alert-container";
    document.body.appendChild(alertsContainer);
}

// Показ всплывающего алерта
function showAlertPopup(symbol, change, price) {
    if (change === undefined || price === undefined) {
        console.warn('Alert skipped: missing change or price');
        return;
    }

    const direction = change > 0 ? 'up' : 'down';
    const arrow = direction === 'up' ? '↑' : '↓';

    const alertBox = document.createElement('div');
    alertBox.className = `alert-popup alert-popup-${direction}`;
    alertBox.innerHTML = `
        <span class="arrow">${arrow}</span>
        <strong>${symbol}</strong>: ${change > 0 ? '+' : ''}${change.toFixed(2)}%
        <span class="price">(${price})</span>
    `;

    // Появление с анимацией
    alertBox.style.opacity = '0';
    alertBox.style.transform = 'translateY(20px)';
    alertsContainer.appendChild(alertBox);
    requestAnimationFrame(() => {
        alertBox.style.opacity = '1';
        alertBox.style.transform = 'translateY(0)';
    });

    // Добавление в историю
    alertHistory.push({
        symbol,
        change,
        price,
        time: new Date().toLocaleTimeString()
    });
    updateAlertHistory();

    // Исчезновение
    setTimeout(() => {
        alertBox.style.opacity = '0';
        alertBox.style.transform = 'translateY(20px)';
        setTimeout(() => alertBox.remove(), 500);
    }, 5000);
}

// Переключение истории алертов
function showAlertHistory() {
    const historyContainer = document.querySelector('.alert-history-container');
    if (!historyContainer) return;
    historyContainer.style.display = historyContainer.style.display === 'block' ? 'none' : 'block';
}

// Обновить список истории
function updateAlertHistory() {
    const historyContainer = document.querySelector('.alert-history-container');
    if (!historyContainer) return;

    historyContainer.innerHTML = '';

    alertHistory.slice().reverse().forEach(alert => {
        const entry = document.createElement('div');
        entry.className = 'alert-history-entry';
        entry.innerHTML = `
            <div><strong>${alert.symbol}</strong>: ${alert.change > 0 ? '+' : ''}${alert.change.toFixed(2)}%</div>
            <div class="time">${alert.time}</div>
            <div class="price">Цена: ${alert.price}</div>
        `;
        historyContainer.appendChild(entry);
    });
}

// Навешиваем обработчик на кнопку истории
document.querySelector('.alert-history-button')?.addEventListener('click', showAlertHistory);
