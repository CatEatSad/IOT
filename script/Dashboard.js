const ws = new WebSocket('ws://localhost:8080');
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received data:', data);
    updateData(data);
};

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
            light: Math.random() * 100 // Light value between 0-100
        })),
    }
};


// Create chart
const ctx = document.getElementById('chart').getContext('2d');
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: initialData.labels,
        datasets: [
            {
                label: 'Temperature (°C)',
                data: initialData.dataset.data.map(d => d.temperature),
                borderColor: '#ff7300',
                tension: 0.4
            },
            {
                label: 'Humidity (%)',
                data: initialData.dataset.data.map(d => d.humidity),
                borderColor: '#0088FE',
                tension: 0.4
            },
            {
                label: 'Light (0-100)',
                data: initialData.dataset.data.map(d => d.light),
                borderColor: '#00C49F',
                tension: 0.4
            }
        ]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: false,
                max: 100 // Set the maximum for the Y-axis
            },
            x: {
                ticks: {
                    maxTicksLimit: 6
                }
            }
        }
    }
});

// Function to update the chart and the display values
const updateData = (data) => {
    const currentTime = new Date().toLocaleTimeString();
    initialData.labels.push(currentTime);
    initialData.labels.shift();

    // Use received data
    const newTemperature = data.temperature;
    const newHumidity = data.humidity;
    const newLight = data.lux;

    // Add new data
    initialData.dataset.data.push({ temperature: newTemperature, humidity: newHumidity, light: newLight });
    initialData.dataset.data.shift(); // Remove the oldest data point

    // Update chart data
    chart.data.labels = initialData.labels;
    chart.data.datasets[0].data = initialData.dataset.data.map(d => d.temperature);
    chart.data.datasets[1].data = initialData.dataset.data.map(d => d.humidity);
    chart.data.datasets[2].data = initialData.dataset.data.map(d => d.light/10);

    chart.update();

    // Update display values
    document.getElementById('temperature-value').textContent = newTemperature.toFixed(1) + '°C';
    document.getElementById('humidity-value').textContent = newHumidity.toFixed(1) + '%';
    document.getElementById('light-value').textContent = (newLight).toFixed(1) + ' lux'; // Display light value multiplied by 10
};

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

function postSwitchState(deviceName, deviceId, state) {
    const payload = {
        deviceName: deviceName,
        deviceId: deviceId,
        timestamp: new Date().toISOString(),
        state: state
    };

    fetch('http://localhost:3000/api/switch-state', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => console.log('Success:', data))
    .catch(error => console.error('Error:', error));
}

// Function to save switch state to localStorage
function saveSwitchState(event) {
    const switchElement = event.target;
    const deviceName = switchElement.getAttribute('data-device-name');
    const deviceId = switchElement.id;
    const state = switchElement.checked;

    localStorage.setItem(deviceId, state);

    // Update the icon state when the switch is toggled
    updateIconState(deviceId, state);

    // Post the switch state
    postSwitchState(deviceName, deviceId, state);
}

// Load switch state from localStorage
function loadSwitchState() {
    const switches = ['fan-switch', 'ac-switch', 'light-switch'];
    switches.forEach(id => {
        const switchElement = document.getElementById(id);
        const savedState = localStorage.getItem(id) === 'true';
        switchElement.checked = savedState;
        updateIconState(id, savedState);
    });
}

// Event listeners
document.getElementById('fan-switch').addEventListener('change', saveSwitchState);
document.getElementById('ac-switch').addEventListener('change', saveSwitchState);
document.getElementById('light-switch').addEventListener('change', saveSwitchState);

// Load the saved states on initial load
loadSwitchState();
