 const initialData = {
            labels: Array.from({length: 20}, (_, i) => i),
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: Array.from({length: 20}, () => 22 + Math.random() * 5 - 2.5),
                    borderColor: '#ff7300',
                    tension: 0.4
                },
                {
                    label: 'Humidity (%)',
                    data: Array.from({length: 20}, () => 65 + Math.random() * 10 - 5),
                    borderColor: '#0088FE',
                    tension: 0.4
                },
                {
                    label: 'Light (lux)',
                    data: Array.from({length: 20}, () => 450 + Math.random() * 100 - 50),
                    borderColor: '#00C49F',
                    tension: 0.4
                }
            ]
        };

        // Create chart
        const ctx = document.getElementById('chart').getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: initialData.labels,
                datasets: [initialData.datasets[0]] // Start with temperature
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Function to show selected chart
        function showChart(type) {
            const index = type === 'temperature' ? 0 : type === 'humidity' ? 1 : 2;
            chart.data.datasets = [initialData.datasets[index]];
            chart.update();

            // Update active class
            document.querySelectorAll('.info-card').forEach(card => card.classList.remove('active'));
            document.getElementById(`${type}-card`).classList.add('active');
        }

        // Update function
        const updateData = () => {
            initialData.datasets.forEach(dataset => {
                dataset.data.shift();
                let lastValue = dataset.data[dataset.data.length - 1];
                let newValue;
                switch(dataset.label) {
                    case 'Temperature (°C)':
                        newValue = Math.max(0, lastValue + Math.random() * 2 - 1);
                        break;
                    case 'Humidity (%)':
                        newValue = Math.max(0, Math.min(100, lastValue + Math.random() * 4 - 2));
                        break;
                    case 'Light (lux)':
                        newValue = Math.max(0, lastValue + Math.random() * 50 - 25);
                        break;
                }
                dataset.data.push(newValue);
            });

            document.getElementById('temperature-value').textContent = 
                initialData.datasets[0].data[initialData.datasets[0].data.length - 1].toFixed(1) + '°C';
            document.getElementById('humidity-value').textContent = 
                initialData.datasets[1].data[initialData.datasets[1].data.length - 1].toFixed(1) + '%';
            document.getElementById('light-value').textContent = 
                initialData.datasets[2].data[initialData.datasets[2].data.length - 1].toFixed(1) + ' lux';

            chart.update();
        };

        // Update every second
        setInterval(updateData, 1000);


// Function to load switch states from localStorage
function loadSwitchStates() {
    const switches = ['fan-switch', 'ac-switch', 'light-switch'];
    switches.forEach(id => {
        const switchElement = document.getElementById(id);
        if (switchElement) {
            const state = localStorage.getItem(id);
            if (state !== null) {
                switchElement.checked = JSON.parse(state);
                
                // Update the icon state based on the saved state
                if (id === 'fan-switch') {
                    updateFanIconState(switchElement.checked);
                }
            }
        }
    });
}

// Function to load switch states from localStorage
function loadSwitchStates() {
    const switches = ['fan-switch', 'ac-switch', 'light-switch'];
    switches.forEach(id => {
        const switchElement = document.getElementById(id);
        if (switchElement) {
            const state = localStorage.getItem(id);
            if (state !== null) {
                switchElement.checked = JSON.parse(state);

                // Update the icon state based on the saved state
                updateIconState(id, switchElement.checked);
            }
        }
    });
}

// Function to update the icon's state
function updateIconState(id, isOn) {
    const iconIdMap = {
        'fan-switch': 'fan-icon',
        'ac-switch': 'ac-icon',
        'light-switch': 'light-icon'
    };

    const iconWrapperIdMap = {
        'fan-switch': 'fan-icon-wrapper',
        'ac-switch': 'ac-icon-wrapper',
        'light-switch': 'light-icon-wrapper'
    };

    const icon = document.getElementById(iconIdMap[id]);
    const iconWrapper = document.getElementById(iconWrapperIdMap[id]);

    if (icon && iconWrapper) {
        if (isOn) {
            icon.classList.add('rotate');
            icon.classList.add('active');
            iconWrapper.classList.add('active');
        } else {
            icon.classList.remove('rotate');
            icon.classList.remove('active');
            iconWrapper.classList.remove('active');
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

// Add event listeners to switches
function addEventListeners() {
    const switches = document.querySelectorAll('.switch input');
    switches.forEach(switchElement => {
        switchElement.addEventListener('change', saveSwitchState);
    });
}

// Initialize switches
document.addEventListener('DOMContentLoaded', () => {
    loadSwitchStates();
    addEventListeners();
});
