// ============================================
// SMART IRON MONITORING SYSTEM - JAVASCRIPT
// ============================================

// ============================================
// 1. GLOBAL STATE & CONFIG
// ============================================

const app = {
    isLoggedIn: false,
    currentUser: null,
    charts: {},
    dataUpdateInterval: null,
    sensorData: {
        temperature: 28,
        humidity: 65,
        status: 'Safe'
    },
    thresholds: {
        risk: 70,
        danger: 85
    },
    alerts: [
        { id: 1, type: 'info', title: 'System Active', message: 'Real-time monitoring is running smoothly' }
    ],
    dataHistory: [],
    settings: {
        updateFrequency: 5,
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true
    }
};

// ============================================
// 2. UTILITY FUNCTIONS
// ============================================

/**
 * Generate random data within a range
 */
function generateRandomData(min, max, decimal = 0) {
    const value = Math.random() * (max - min) + min;
    return decimal > 0 ? parseFloat(value.toFixed(decimal)) : Math.round(value);
}

/**
 * Format date/time
 */
function formatDateTime(date = new Date()) {
    const pad = (n) => n.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Get relative time string
 */
function getRelativeTime() {
    return 'just now';
}

/**
 * Save data to localStorage
 */
function saveToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Load data from localStorage
 */
function loadFromLocalStorage(key, defaultValue = null) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const iconMap = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="${iconMap[type]}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

/**
 * Animate counter
 */
function animateCounter(element, targetValue, duration = 1000) {
    const startValue = parseFloat(element.textContent);
    const startTime = Date.now();

    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = startValue + (targetValue - startValue) * progress;

        if (element.textContent.includes('°')) {
            element.textContent = Math.round(currentValue) + '°C';
        } else if (element.textContent.includes('%')) {
            element.textContent = Math.round(currentValue) + '%';
        } else {
            element.textContent = Math.round(currentValue);
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    update();
}

// ============================================
// 3. LOGIN PAGE LOGIC
// ============================================

function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const loginBtn = document.getElementById('loginBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorAlert = document.getElementById('errorAlert');

    // Toggle password visibility
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            togglePasswordBtn.innerHTML = isPassword 
                ? '<i class="fas fa-eye-slash"></i>' 
                : '<i class="fas fa-eye"></i>';
        });
    }

    // Form submission
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleLogin();
        });
    }

    function handleLogin() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        // Clear errors
        document.getElementById('usernameError').classList.remove('show');
        document.getElementById('passwordError').classList.remove('show');
        errorAlert.classList.remove('show');

        // Validation
        let isValid = true;

        if (!username) {
            document.getElementById('usernameError').textContent = 'Username is required';
            document.getElementById('usernameError').classList.add('show');
            isValid = false;
        }

        if (!password) {
            document.getElementById('passwordError').textContent = 'Password is required';
            document.getElementById('passwordError').classList.add('show');
            isValid = false;
        }

        if (!isValid) return;

        // Show loading
        loadingSpinner.classList.add('show');
        loginBtn.disabled = true;

        // Simulate authentication
        setTimeout(() => {
            // Demo credentials
            if (username === 'admin' && password === 'password123') {
                // Success
                app.isLoggedIn = true;
                app.currentUser = username;
                saveToLocalStorage('user', { username, loginTime: new Date() });
                
                loadingSpinner.classList.remove('show');
                window.location.href = 'dashboard.html';
            } else {
                // Error
                loadingSpinner.classList.remove('show');
                loginBtn.disabled = false;
                errorAlert.textContent = 'Invalid username or password. Try admin / password123';
                errorAlert.classList.add('show');
            }
        }, 1500);
    }
}

// ============================================
// 4. DASHBOARD - INITIALIZATION
// ============================================

function initDashboard() {
    // Check if user is logged in
    const user = loadFromLocalStorage('user');
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    app.currentUser = user.username;
    document.getElementById('userName').textContent = user.username.charAt(0).toUpperCase() + user.username.slice(1);

    // Load saved settings
    const savedSettings = loadFromLocalStorage('settings', app.settings);
    app.settings = savedSettings;
    app.thresholds = loadFromLocalStorage('thresholds', app.thresholds);

    // Initialize dashboard components
    initNavigation();
    initThemeToggle();
    initLogout();
    initDataSimulation();
    initCharts();
    initSettings();
    initEventListeners();

    // Load initial data
    updateDashboardData();
    generateHistoricalData(24);
}

// ============================================
// 5. NAVIGATION
// ============================================

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sidebar = document.getElementById('sidebar');
    const toggleSidebarBtn = document.getElementById('toggleSidebar');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));

            // Add active class to clicked item
            item.classList.add('active');

            // Get section id
            const sectionId = item.getAttribute('data-section');

            // Update section title
            updateSectionTitle(sectionId);

            // Show active section
            showSection(sectionId);

            // Close sidebar on mobile
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
            }
        });
    });

    // Toggle sidebar
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !toggleSidebarBtn.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section-content').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
}

function updateSectionTitle(sectionId) {
    const titles = {
        'dashboard': 'Dashboard',
        'live-data': 'Live Data Stream',
        'graphs': 'Analytics & Trends',
        'history': 'Historical Data',
        'alerts': 'Alerts & Notifications',
        'settings': 'Settings & Configuration'
    };

    const subtitles = {
        'dashboard': 'Real-time monitoring and analytics',
        'live-data': 'Current sensor readings and system status',
        'graphs': 'Temperature and humidity trends',
        'history': 'View historical sensor data',
        'alerts': 'System alerts and notifications',
        'settings': 'Configure system preferences'
    };

    document.getElementById('sectionTitle').textContent = titles[sectionId] || 'Dashboard';
    document.getElementById('sectionSubtitle').textContent = subtitles[sectionId] || '';
}

// ============================================
// 6. THEME TOGGLE (DARK MODE)
// ============================================

function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = loadFromLocalStorage('theme', 'light');

    // Apply saved theme
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', newTheme);
        saveToLocalStorage('theme', newTheme);

        themeToggle.innerHTML = newTheme === 'dark' 
            ? '<i class="fas fa-sun"></i>' 
            : '<i class="fas fa-moon"></i>';
    });
}

// ============================================
// 7. LOGOUT
// ============================================

function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }
}

// ============================================
// 8. DATA SIMULATION & UPDATES
// ============================================

function initDataSimulation() {
    // Initial data
    updateSensorData();

    // Start continuous update
    const updateFrequency = app.settings.updateFrequency * 1000;
    app.dataUpdateInterval = setInterval(() => {
        updateSensorData();
    }, updateFrequency);
}

function updateSensorData() {
    // Simulate by gradually changing values
    app.sensorData.temperature = generateRandomData(22, 35, 1);
    app.sensorData.humidity = generateRandomData(45, 88, 1);

    // Determine status based on humidity
    if (app.sensorData.humidity > app.thresholds.danger) {
        app.sensorData.status = 'Danger';
    } else if (app.sensorData.humidity > app.thresholds.risk) {
        app.sensorData.status = 'Risk';
    } else {
        app.sensorData.status = 'Safe';
    }

    // Update dashboard
    updateDashboardData();

    // Add to history
    addToHistory();

    // Check and add alerts if needed
    checkAndAddAlerts();
}

function updateDashboardData() {
    // Update temperature
    const tempValue = document.getElementById('tempValue');
    const liveTemp = document.getElementById('liveTemp');
    const liveTempCurrent = document.getElementById('liveTempCurrent');
    
    if (tempValue) {
        animateCounter(tempValue, app.sensorData.temperature, 500);
    }
    if (liveTemp) {
        liveTemp.textContent = `${app.sensorData.temperature}°C`;
    }
    if (liveTempCurrent) {
        liveTempCurrent.textContent = Math.round(app.sensorData.temperature);
    }

    // Update humidity
    const humidityValue = document.getElementById('humidityValue');
    const liveHumidity = document.getElementById('liveHumidity');
    const liveHumidityCurrent = document.getElementById('liveHumidityCurrent');
    
    if (humidityValue) {
        animateCounter(humidityValue, app.sensorData.humidity, 500);
    }
    if (liveHumidity) {
        liveHumidity.textContent = `${app.sensorData.humidity}%`;
    }
    if (liveHumidityCurrent) {
        liveHumidityCurrent.textContent = Math.round(app.sensorData.humidity);
    }

    // Update status
    updateStatusDisplay();

    // Update last update time
    const lastUpdate = document.getElementById('lastUpdate');
    if (lastUpdate) {
        lastUpdate.textContent = getRelativeTime();
    }
}

function updateStatusDisplay() {
    const statusLabel = document.getElementById('statusLabel');
    const statusBadge = document.getElementById('statusBadge');
    const statusDescription = document.getElementById('statusDescription');

    let status = app.sensorData.status;
    let icon = '<i class="fas fa-check-circle"></i>';
    let description = 'All systems nominal';

    if (status === 'Danger') {
        icon = '<i class="fas fa-exclamation-circle"></i>';
        description = 'Critical humidity level - Risk of rust damage!';
    } else if (status === 'Risk') {
        icon = '<i class="fas fa-exclamation-triangle"></i>';
        description = 'Humidity rising - Risk of rust approaching';
    }

    if (statusLabel) statusLabel.textContent = status;
    if (statusBadge) {
        statusBadge.className = `status-badge ${status.toLowerCase()}`;
        statusBadge.innerHTML = `${icon} <span>${status}</span>`;
    }
    if (statusDescription) statusDescription.textContent = description;
}

// ============================================
// 9. ALERTS SYSTEM
// ============================================

function checkAndAddAlerts() {
    const humidity = app.sensorData.humidity;
    let alertTriggered = false;

    if (humidity > app.thresholds.danger) {
        if (!app.alerts.find(a => a.id === 'danger')) {
            app.alerts.push({
                id: 'danger',
                type: 'danger',
                title: 'Critical Humidity',
                message: 'Humidity has exceeded danger threshold!'
            });
            alertTriggered = true;
        }
    } else {
        app.alerts = app.alerts.filter(a => a.id !== 'danger');
    }

    if (humidity > app.thresholds.risk && humidity <= app.thresholds.danger) {
        if (!app.alerts.find(a => a.id === 'risk')) {
            app.alerts.push({
                id: 'risk',
                type: 'warning',
                title: 'High Humidity',
                message: 'Rust risk detected - Monitor closely!'
            });
            alertTriggered = true;
        }
    } else {
        app.alerts = app.alerts.filter(a => a.id !== 'risk');
    }

    if (alertTriggered) {
        showToast('New alert generated!', 'warning');
    }

    updateAlertsDisplay();
}

function updateAlertsDisplay() {
    const alertsList = document.getElementById('alertsList');
    const alertsFullList = document.getElementById('alertsFullList');
    const alertBadge = document.getElementById('alertBadge');

    if (alertBadge) {
        alertBadge.textContent = app.alerts.length;
    }

    // Update main alerts list
    if (alertsList) {
        alertsList.innerHTML = app.alerts.map(alert => `
            <div class="alert-item ${alert.type}-alert">
                <i class="fas fa-${alert.type === 'danger' ? 'exclamation-circle' : alert.type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <div class="alert-content">
                    <p class="alert-title">${alert.title}</p>
                    <p class="alert-message">${alert.message}</p>
                </div>
                <span class="alert-time">Now</span>
            </div>
        `).join('');
    }

    // Update full alerts list
    if (alertsFullList) {
        alertsFullList.innerHTML = app.alerts.map(alert => `
            <div class="alert-item ${alert.type}-alert">
                <i class="fas fa-${alert.type === 'danger' ? 'exclamation-circle' : alert.type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <div class="alert-content">
                    <p class="alert-title">${alert.title}</p>
                    <p class="alert-message">${alert.message}</p>
                </div>
                <span class="alert-time">Now</span>
            </div>
        `).join('');
    }
}

function clearAlerts() {
    app.alerts = app.alerts.filter(a => a.type === 'info');
    updateAlertsDisplay();
    showToast('Alerts cleared', 'success');
}

// ============================================
// 10. HISTORY SYSTEM
// ============================================

function addToHistory() {
    const now = new Date();
    app.dataHistory.push({
        timestamp: formatDateTime(now),
        temperature: app.sensorData.temperature,
        humidity: app.sensorData.humidity,
        status: app.sensorData.status
    });

    // Keep only last 100 records
    if (app.dataHistory.length > 100) {
        app.dataHistory.shift();
    }

    updateHistoryDisplay();
}

function generateHistoricalData(hours) {
    app.dataHistory = [];
    const now = new Date();

    for (let i = hours; i > 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        const temp = generateRandomData(22, 35, 1);
        const humidity = generateRandomData(45, 88, 1);
        let status = 'Safe';

        if (humidity > app.thresholds.danger) {
            status = 'Danger';
        } else if (humidity > app.thresholds.risk) {
            status = 'Risk';
        }

        app.dataHistory.push({
            timestamp: formatDateTime(time),
            temperature: temp,
            humidity: humidity,
            status: status
        });
    }

    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const historyTable = document.getElementById('historyTable');
    if (!historyTable) return;

    const rows = app.dataHistory.slice(-10).reverse().map(record => `
        <tr>
            <td>${record.timestamp}</td>
            <td>${record.temperature}°C</td>
            <td>${record.humidity}%</td>
            <td><span class="status-badge ${record.status.toLowerCase()}">
                ${record.status === 'Danger' ? '<i class="fas fa-exclamation-circle"></i>' : record.status === 'Risk' ? '<i class="fas fa-exclamation-triangle"></i>' : '<i class="fas fa-check-circle"></i>'}
                ${record.status}
            </span></td>
            <td>${record.status === 'Danger' ? 'Critical humidity!' : record.status === 'Risk' ? 'Humidity rising' : 'Normal operation'}</td>
        </tr>
    `).join('');

    historyTable.innerHTML = rows;
}

// ============================================
// 11. CHARTS
// ============================================

function initCharts() {
    // Get chart contexts
    const tempChartCanvas = document.getElementById('temperatureChart');
    const humidityChartCanvas = document.getElementById('humidityChart');

    if (!tempChartCanvas || !humidityChartCanvas) return;

    const ctx1 = tempChartCanvas.getContext('2d');
    const ctx2 = humidityChartCanvas.getContext('2d');

    // Prepare data for charts
    const chartData = prepareChartData();

    // Temperature Chart
    app.charts.temperature = new Chart(ctx1, {
        type: 'line',
        data: chartData.temperature,
        options: getChartOptions('Temperature (°C)', '#2196F3')
    });

    // Humidity Chart
    app.charts.humidity = new Chart(ctx2, {
        type: 'line',
        data: chartData.humidity,
        options: getChartOptions('Humidity (%)', '#2196F3')
    });

    // Chart control buttons
    initChartControls();
}

function prepareChartData() {
    const labels = app.dataHistory.map(h => h.timestamp.split(' ')[1]).slice(-24);
    const temperatures = app.dataHistory.map(h => h.temperature).slice(-24);
    const humidities = app.dataHistory.map(h => h.humidity).slice(-24);

    return {
        temperature: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: temperatures,
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#2196F3',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 6
            }]
        },
        humidity: {
            labels: labels,
            datasets: [{
                label: 'Humidity (%)',
                data: humidities,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#4CAF50',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 6
            }]
        }
    };
}

function getChartOptions(title, color) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                labels: {
                    usePointStyle: true,
                    padding: 15,
                    font: {
                        family: "'Poppins', sans-serif",
                        size: 12
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    font: {
                        family: "'Poppins', sans-serif"
                    }
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        family: "'Poppins', sans-serif"
                    }
                }
            }
        }
    };
}

function initChartControls() {
    const chartControlBtns = document.querySelectorAll('.chart-control-btn');
    chartControlBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            chartControlBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            // Here you would filter chart data by range
            // For now, we'll just keep the same data
        });
    });
}

// ============================================
// 12. SETTINGS
// ============================================

function initSettings() {
    const humidityRiskThreshold = document.getElementById('humidityRiskThreshold');
    const humidityDangerThreshold = document.getElementById('humidityDangerThreshold');
    const riskValue = document.getElementById('riskValue');
    const dangerValue = document.getElementById('dangerValue');
    const updateFrequency = document.getElementById('updateFrequency');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const clearAlertsBtn = document.getElementById('clearAlertsBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    // Set initial values
    if (humidityRiskThreshold) {
        humidityRiskThreshold.value = app.thresholds.risk;
        riskValue.textContent = app.thresholds.risk;

        humidityRiskThreshold.addEventListener('input', (e) => {
            riskValue.textContent = e.target.value;
        });
    }

    if (humidityDangerThreshold) {
        humidityDangerThreshold.value = app.thresholds.danger;
        dangerValue.textContent = app.thresholds.danger;

        humidityDangerThreshold.addEventListener('input', (e) => {
            dangerValue.textContent = e.target.value;
        });
    }

    if (updateFrequency) {
        updateFrequency.value = app.settings.updateFrequency;
    }

    // Save settings
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            app.thresholds.risk = parseInt(humidityRiskThreshold.value);
            app.thresholds.danger = parseInt(humidityDangerThreshold.value);
            app.settings.updateFrequency = parseInt(updateFrequency.value);

            // Update checkbox states
            document.querySelectorAll('.setting-item.checkbox input').forEach(checkbox => {
                const settingName = checkbox.id;
                app.settings[settingName] = checkbox.checked;
            });

            saveToLocalStorage('thresholds', app.thresholds);
            saveToLocalStorage('settings', app.settings);

            // Restart data update interval
            clearInterval(app.dataUpdateInterval);
            app.dataUpdateInterval = setInterval(updateSensorData, app.settings.updateFrequency * 1000);

            showToast('Settings saved successfully!', 'success');
        });
    }

    // Clear alerts
    if (clearAlertsBtn) {
        clearAlertsBtn.addEventListener('click', clearAlerts);
    }

    // Download CSV
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadDataAsCSV);
    }
}

function downloadDataAsCSV() {
    if (app.dataHistory.length === 0) {
        showToast('No data to download', 'warning');
        return;
    }

    let csv = 'Timestamp,Temperature (°C),Humidity (%),Status\n';

    app.dataHistory.forEach(record => {
        csv += `"${record.timestamp}",${record.temperature},${record.humidity},${record.status}\n`;
    });

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iron-monitor-data-${formatDateTime().replace(/\s/g, '_').replace(/:/g, '-')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showToast('Data downloaded successfully!', 'success');
}

// ============================================
// 13. EVENT LISTENERS
// ============================================

function initEventListeners() {
    // Filter alerts
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');
            filterAlerts(filter);
        });
    });
}

function filterAlerts(filter) {
    const alertsFullList = document.getElementById('alertsFullList');
    if (!alertsFullList) return;

    let filtered = app.alerts;

    if (filter !== 'all') {
        filtered = app.alerts.filter(a => a.type === filter);
    }

    alertsFullList.innerHTML = filtered.map(alert => `
        <div class="alert-item ${alert.type}-alert">
            <i class="fas fa-${alert.type === 'danger' ? 'exclamation-circle' : alert.type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <div class="alert-content">
                <p class="alert-title">${alert.title}</p>
                <p class="alert-message">${alert.message}</p>
            </div>
            <span class="alert-time">Now</span>
        </div>
    `).join('');
}

// ============================================
// 14. INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on login or dashboard page
    const pageTitle = document.title;

    if (pageTitle.includes('Login')) {
        initLoginPage();
    } else if (pageTitle.includes('Dashboard')) {
        initDashboard();
    }
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, could pause updates
    } else {
        // Page is visible, ensure data is fresh
        if (app.isLoggedIn || loadFromLocalStorage('user')) {
            updateSensorData();
        }
    }
});

// Responsive sidebar
window.addEventListener('resize', () => {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth > 768) {
        sidebar.classList.remove('active');
    }
});
