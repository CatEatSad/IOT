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
const updateData = () => {
    const currentTime = new Date().toLocaleTimeString();
    initialData.labels.push(currentTime);
    initialData.labels.shift();

    // Generate new data
    const newTemperature = Math.max(25, Math.min(40, initialData.dataset.data[initialData.dataset.data.length - 1].temperature + Math.random() * 2 - 1));
    const newHumidity = Math.max(0, Math.min(100, initialData.dataset.data[initialData.dataset.data.length - 1].humidity + Math.random() * 4 - 2));
    const newLight = Math.max(0, Math.min(100, initialData.dataset.data[initialData.dataset.data.length - 1].light + Math.random() * 10 - 5)); // light stays in range 0-100

    // Add new data
    initialData.dataset.data.push({ temperature: newTemperature, humidity: newHumidity, light: newLight });
    initialData.dataset.data.shift(); // Remove the oldest data point

    // Update chart data
    chart.data.labels = initialData.labels;
    chart.data.datasets[0].data = initialData.dataset.data.map(d => d.temperature);
    chart.data.datasets[1].data = initialData.dataset.data.map(d => d.humidity);
    chart.data.datasets[2].data = initialData.dataset.data.map(d => d.light);

    chart.update();

    // Update display values
    document.getElementById('temperature-value').textContent = newTemperature.toFixed(1) + '°C';
    document.getElementById('humidity-value').textContent = newHumidity.toFixed(1) + '%';
    document.getElementById('light-value').textContent = (newLight * 10).toFixed(1) + ' lux'; // Display light value multiplied by 10
};

// Update every second
setInterval(updateData, 1000);

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

// Function to save switch state to localStorage
function saveSwitchState(event) {
    const switchElement = event.target;
    localStorage.setItem(switchElement.id, switchElement.checked);

    // Update the icon state when the switch is toggled
    updateIconState(switchElement.id, switchElement.checked);
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
