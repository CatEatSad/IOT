// WebSocket connections
const wsSensor = new WebSocket('ws://localhost:8080');
const wsDevice = new WebSocket('ws://localhost:8081');
const pendingStateChanges = new Map();

// State management object
const dashboardState = {
    currentView: 'all', // 'all', 'temperature', 'humidity', 'light', 'dust'
    chartData: {
        labels: [],
        datasets: []
    },
    lastValues: {
        temperature: 25.0,
        humidity: 65.0,
        light: 450.0,
    }
};

// Initialize data - updated to include dust
const initialData = {
    labels: Array.from({ length: 20 }, (_, i) => {
        const date = new Date();
        date.setSeconds(date.getSeconds() - (19 - i));
        return date.toLocaleTimeString();
    }),
    dataset: {
        data: Array.from({ length: 20 }, () => ({
            temperature: 25 + Math.random() * 15,
            humidity: 65 + Math.random() * 10 - 5,
            light: Math.random() * 100,
        })),
    }
};


// Initialize data

// Create chart with proper error handling
let chart;
try {
    const ctx = document.getElementById('chart');
    if (!ctx) {
        throw new Error('Chart canvas element not found');
    }

    chart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: initialData.labels,
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: initialData.dataset.data.map(d => d.temperature),
                    borderColor: '#ff7300',
                    tension: 0.4,
                    hidden: false
                },
                {
                    label: 'Humidity (%)',
                    data: initialData.dataset.data.map(d => d.humidity),
                    borderColor: '#0088FE',
                    tension: 0.4,
                    hidden: false
                },
                {
                    label: 'Light (0-200)',
                    data: initialData.dataset.data.map(d => d.light),
                    borderColor: '#00C49F',
                    tension: 0.4,
                    hidden: false
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    max: 200
                },
                x: {
                    ticks: {
                        maxTicksLimit: 6
                    }
                }
            }
        }
    });
} catch (error) {
    console.error('Error initializing chart:', error);
}


// Background image functions
const getTemperatureBackground = (value) => {
    if (!value && value !== 0) return '';
    if (value < 20) return "url('../assets/background-value/temperature/cold.jpg')";
    if (value < 30) return "url('../assets/background-value/temperature/cool.webp')";
    return "url('../assets/background-value/temperature/hot.jpg')";
};

const getHumidityBackground = (value) => {
    if (!value && value !== 0) return '';
    return value >= 70 
        ? "url('../assets/background-value/humidity/high-humidity.jpg')"
        : "url('../assets/background-value/humidity/low-humidity.jpg')";
};

const getLightBackground = (value) => {
    if (!value && value !== 0) return '';
    if (value <= 200) return "url('../assets/background-value/light/low-light.jpg')";
    if (value <= 600) return "url('../assets/background-value/light/middle-light.avif')";
    return "url('../assets/background-value/light/high-light.jpg')";
};

// Update card backgrounds with error handling
const updateCardBackgrounds = (temperature, humidity, light) => {
    try {
        const elements = {
            temperature: document.getElementById('temperature-card'),
            humidity: document.getElementById('humidity-card'),
            light: document.getElementById('light-card'),
        };

        // Verify all elements exist
        Object.entries(elements).forEach(([key, element]) => {
            if (!element) {
                throw new Error(`${key} card element not found`);
            }
        });

        // Update backgrounds
        elements.temperature.style.backgroundImage = getTemperatureBackground(temperature);
        elements.humidity.style.backgroundImage = getHumidityBackground(humidity);
        elements.light.style.backgroundImage = getLightBackground(light);

        // Apply common styles
        Object.values(elements).forEach(card => {
            card.style.backgroundSize = 'cover';
            card.style.backgroundPosition = 'center';
            card.style.position = 'relative';

            // Update or create overlay
            let overlay = card.querySelector('.card-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'card-overlay';
                card.insertBefore(overlay, card.firstChild);
            }

            // Style content elements
            card.querySelectorAll('h2, .info-value').forEach(element => {
                element.style.position = 'relative';
                element.style.zIndex = '2';
                element.style.color = 'white';
                element.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
            });
        });
    } catch (error) {
        console.error('Error updating card backgrounds:', error);
    }
};

// Save state to localStorage
function saveDashboardState() {
    try {
        localStorage.setItem('dashboardState', JSON.stringify(dashboardState));
    } catch (error) {
        console.error('Error saving dashboard state:', error);
    }
}

// Load state from localStorage
function loadDashboardState() {
    try {
        const savedState = localStorage.getItem('dashboardState');
        if (savedState) {
            const state = JSON.parse(savedState);
            Object.assign(dashboardState, state);

            // Restore chart data if chart exists
            if (chart && chart.data) {
                chart.data.labels = dashboardState.chartData.labels;
                chart.data.datasets = dashboardState.chartData.datasets;
                chart.update();
            }

            // Restore info values
            updateInfoValues(dashboardState.lastValues);

            // Restore view state
            showChart(dashboardState.currentView);
        }
    } catch (error) {
        console.error('Error loading dashboard state:', error);
    }
}

// Show chart with proper validation
function showChart(view) {
    if (!chart || !chart.data || !chart.data.datasets) {
        console.warn('Chart not properly initialized');
        return;
    }

    dashboardState.currentView = view;
    const datasets = chart.data.datasets;

    switch (view) {
        case 'temperature':
            datasets.forEach(dataset => dataset.hidden = true);
            datasets[0].hidden = false;
            break;
        case 'humidity':
            datasets.forEach(dataset => dataset.hidden = true);
            datasets[1].hidden = false;
            break;
        case 'light':
            datasets.forEach(dataset => dataset.hidden = true);
            datasets[2].hidden = false;
            break;
        case 'all':
        default:
            // Hiển thị tất cả datasets thay vì ẩn chúng
            datasets.forEach(dataset => dataset.hidden = false);
            break;
    }

    chart.update();
    saveDashboardState();
}

// Update info values with validation
function updateInfoValues(values) {
    try {
        if (!values) throw new Error('No values provided');

        const elements = {
            temperature: document.getElementById('temperature-value'),
            humidity: document.getElementById('humidity-value'),
            light: document.getElementById('light-value'),
        };

        // Verify all elements exist
        Object.entries(elements).forEach(([key, element]) => {
            if (!element) {
                throw new Error(`${key} value element not found`);
            }
        });

        // Update values
        elements.temperature.textContent = `${values.temperature.toFixed(1)}°C`;
        elements.humidity.textContent = `${values.humidity.toFixed(1)}%`;
        elements.light.textContent = `${values.light.toFixed(1)} lux`;
        

        // Update backgrounds
        updateCardBackgrounds(values.temperature, values.humidity, values.light);

        // Save state
        dashboardState.lastValues = { ...values };
        saveDashboardState();
    } catch (error) {
        console.error('Error updating info values:', error);
    }
}

// Update data with proper error handling
const updateData = (data) => {
    try {
        if (!data) throw new Error('No data provided');
        if (!chart) throw new Error('Chart not initialized');

        const currentTime = new Date().toLocaleTimeString();
        
        // Update chart data
        dashboardState.chartData.labels = [...initialData.labels.slice(1), currentTime];
        
        const newData = {
            temperature: data.temperature,
            humidity: data.humidity,
            light: data.lux,
        };
        
        initialData.dataset.data = [...initialData.dataset.data.slice(1), newData];
        
        // Update chart
        chart.data.labels = dashboardState.chartData.labels;
        chart.data.datasets[0].data = initialData.dataset.data.map(d => d.temperature);
        chart.data.datasets[1].data = initialData.dataset.data.map(d => d.humidity);
        chart.data.datasets[2].data = initialData.dataset.data.map(d => d.light/10);
        
        dashboardState.chartData = {
            labels: chart.data.labels,
            datasets: chart.data.datasets
        };
        
        chart.update();
        updateInfoValues(newData);
        saveDashboardState();
    } catch (error) {
        console.error('Error updating data:', error);
    }
};

// WebSocket message handlers
wsSensor.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        updateData(data);
    } catch (error) {
        console.error('Error processing sensor message:', error);
    }
};

wsDevice.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        if (!data.deviceId) throw new Error('Invalid device data');

        const switchElement = document.getElementById(data.deviceId);
        if (!switchElement) throw new Error('Switch element not found');

        if (pendingStateChanges.has(data.deviceId)) {
            const switchLabel = switchElement.parentElement;
            const loadingImg = switchLabel.parentElement.querySelector('.switch-animation');
            
            if (loadingImg) {
                loadingImg.remove();
                switchLabel.style.opacity = '1';
            }

            updateIconState(data.deviceId, data.state);
            pendingStateChanges.delete(data.deviceId);
            localStorage.setItem(data.deviceId, data.state);
        }
    } catch (error) {
        console.error('Error processing device message:', error);
    }
};

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
    try {
        loadDashboardState();
        loadSwitchState();

        // Add click listeners for cards
        const cards = ['temperature', 'humidity', 'light'];
        cards.forEach(type => {
            const card = document.getElementById(`${type}-card`);
            if (card) {
                card.addEventListener('click', () => showChart(type));
            }
        });
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});

// Add required CSS
const style = document.createElement('style');
style.textContent = `
    .info-card {
        overflow: hidden;
        position: relative;
    }
    
    .card-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.3);
        z-index: 1;
    }
    
    .info-card:hover .card-overlay {
        background: rgba(0, 0, 0, 0.4);
    }
`;
document.head.appendChild(style);


// Function to update the icon's state
function updateIconState(id, isOn) {
    const iconIdMap = {
        'fan-switch': 'fan-icon',
        'ac-switch': 'ac-icon',
        'light-switch': 'light-icon'
    };

    const icon = document.getElementById(iconIdMap[id]);

    if (icon) {
        if (isOn) {
            if (id === 'fan-switch') {
                icon.classList.add('rotate'); // Add rotation class when fan is on
            }
            icon.classList.add('active');
        } else {
            if (id === 'fan-switch') {
                icon.classList.remove('rotate'); // Remove rotation class when fan is off
            }
            icon.classList.remove('active');
        }
    }
}


// Định nghĩa đường dẫn ảnh cho từng trạng thái của thiết bị
const deviceIcons = {
    fan: {
        on: '../assets/devices-Icon/Off/fan.svg',
        off: '../assets/devices-Icon/Off/fan.svg'
    },
    ac: {
        on: '../assets/devices-Icon/On/air-conditioner.gif',
        off: '../assets/devices-Icon/Off/air-conditioner.png'
    },
    light: {
        on: '../assets/devices-Icon/On/light-bulb.gif',
        off: '../assets/devices-Icon/Off/light-bulb.png'
    }
};

// Hàm cập nhật trạng thái và hình ảnh icon
function updateIconState(id, isOn) {
    const iconIdMap = {
        'fan-switch': {
            iconId: 'fan-icon',
            type: 'fan'
        },
        'ac-switch': {
            iconId: 'ac-icon',
            type: 'ac'
        },
        'light-switch': {
            iconId: 'light-icon',
            type: 'light'
        }
    };

    const deviceInfo = iconIdMap[id];
    if (!deviceInfo) return;

    const icon = document.getElementById(deviceInfo.iconId);
    if (!icon) return;

    // Thay đổi hình ảnh dựa trên trạng thái
    icon.src = deviceIcons[deviceInfo.type][isOn ? 'on' : 'off'];

    // Chỉ thêm hiệu ứng quay cho quạt
    if (deviceInfo.type === 'fan') {
        if (isOn) {
            icon.classList.add('rotate');
        } else {
            icon.classList.remove('rotate');
        }
    }
}

// Hàm lưu trạng thái switch
function saveSwitchState(event) {
    const switchElement = event.target;
    const deviceName = switchElement.getAttribute('data-device-name');
    const deviceId = switchElement.id;
    const state = switchElement.checked;

    try {
        localStorage.setItem(deviceId, state);
        updateIconState(deviceId, state);
        postSwitchState(deviceName, deviceId, state);
    } catch (error) {
        console.error('Error saving switch state:', error);
        // Hoàn tác nếu có lỗi
        switchElement.checked = !state;
        updateIconState(deviceId, !state);
        alert('Failed to save switch state. Please try again.');
    }
}


// Thêm hàm để xử lý animation khi click switch
function handleSwitchAnimation(event) {
    const switchElement = event.target;
    const deviceId = switchElement.id;
    const deviceName = switchElement.getAttribute('data-device-name');
    const switchLabel = switchElement.parentElement;
    
    // Get the current state of the switch
    const currentState = switchElement.checked;
    
    // Create loading animation
    const loadingImg = document.createElement('img');
    loadingImg.src = '../assets/loading.gif';
    loadingImg.className = 'switch-animation';
    
    // Hide switch
    switchLabel.style.opacity = '0';
    
    // Insert loading animation
    switchLabel.parentElement.appendChild(loadingImg);
    
    // Add to pending state changes
    pendingStateChanges.set(deviceId, currentState);
    
    // Send state change request
    postSwitchState(deviceName, deviceId, currentState);
    
    // Set timeout for error handling
    setTimeout(() => {
        // If still pending after 10 seconds, assume failure
        if (pendingStateChanges.has(deviceId)) {
            // Remove loading animation
            const loadingImg = switchLabel.parentElement.querySelector('.switch-animation');
            if (loadingImg) {
                loadingImg.remove();
                switchLabel.style.opacity = '1';
            }
            
            // Revert switch state
            switchElement.checked = !currentState;
            updateIconState(deviceId, !currentState);
            
            // Clear pending state
            pendingStateChanges.delete(deviceId);
            
            // Show error message
            alert('Device did not respond. Please try again.');
        }
    }, 100000);
}


// Cập nhật event listeners
function postSwitchState(deviceName, deviceId, state) {
    const payload = {
        deviceName: deviceName,
        deviceId: deviceId,
        timestamp: new Date().toISOString(),
        state: state
    };


    console.log('Sending switch state:', payload);

    fetch('http://localhost:3000/api/switch-state', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .catch(error => {
        console.error('Error:', error);
        // Error handling is now done in the timeout above
    });
}

// Update event listeners
document.getElementById('fan-switch').addEventListener('change', handleSwitchAnimation);
document.getElementById('ac-switch').addEventListener('change', handleSwitchAnimation);
document.getElementById('light-switch').addEventListener('change', handleSwitchAnimation);
// Hàm load trạng thái đã lưu
function loadSwitchState() {
    const switches = ['fan-switch', 'ac-switch', 'light-switch'];
    
    switches.forEach(switchId => {
        const switchElement = document.getElementById(switchId);
        if (switchElement) {
            const savedState = localStorage.getItem(switchId) === 'true';
            switchElement.checked = savedState;
            updateIconState(switchId, savedState);
        }
    });
}


// Load trạng thái khi trang web được tải
loadSwitchState();