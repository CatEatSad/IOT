// WebSocket connection
const wsSensor = new WebSocket('ws://localhost:8082');

// State management object
const dashboardState = {
    currentView: 'all',
    chartData: {
        labels: [],
        datasets: []
    },
    lastValues: {
        windspeed: 0
    },
    isAlertAnimating: false
};

// Initialize data
const initialData = {
    labels: Array.from({ length: 20 }, (_, i) => {
        const date = new Date();
        date.setSeconds(date.getSeconds() - (19 - i));
        return date.toLocaleTimeString();
    }),
    dataset: {
        data: Array.from({ length: 20 }, () => ({
            windspeed: 0,
        })),
    }
};

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
                    label: 'Windspeed (m/s)',
                    data: initialData.dataset.data.map(d => d.windspeed),
                    borderColor: '#00C49F',
                    tension: 0.4,
                    fill: false,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(200, 200, 200, 0.2)'
                    }
                },
                x: {
                    ticks: {
                        maxTicksLimit: 6
                    },
                    grid: {
                        color: 'rgba(200, 200, 200, 0.2)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#333'
                    }
                }
            }
        }
    });
} catch (error) {
    console.error('Error initializing chart:', error);
}

// Function to trigger alert animation
function triggerAlertAnimation() {
    if (dashboardState.isAlertAnimating) return;
    
    const alertCard = document.getElementById('alert-card');
    if (!alertCard) return;

    dashboardState.isAlertAnimating = true;
    
    alertCard.classList.add('flash-alert');
    
    // Remove animation class after it completes
    setTimeout(() => {
        alertCard.classList.remove('flash-alert');
        dashboardState.isAlertAnimating = false;
    }, 1500); // 500ms per flash × 3 flashes
}

// Update card values and styling
function updateInfoValues(values) {
    try {
        if (!values) throw new Error('No values provided');

        const windspeedElement = document.getElementById('windspeed-value');
        if (!windspeedElement) {
            throw new Error('Windspeed value element not found');
        }

        // Update windspeed value
        windspeedElement.textContent = `${values.windspeed.toFixed(1)} m/s`;

        // Update card styling based on windspeed value
        const windspeedCard = document.getElementById('windspeed-card');
        if (windspeedCard) {
            windspeedCard.classList.remove('normal', 'warning', 'danger');
            if (values.windspeed >= 60) {
                windspeedCard.classList.add('danger');
            } else if (values.windspeed > 40) {
                windspeedCard.classList.add('warning');
            } else {
                windspeedCard.classList.add('normal');
            }
        }

        // Update alert card if windspeed is too high
        const alertCard = document.getElementById('alert-card');
        if (alertCard) {
            if (values.windspeed >= 60) {
                alertCard.innerHTML = '<h2>Alert</h2><p class="alert-message">Warning: Dangerous Wind Speed!</p>';
                alertCard.classList.add('danger');
                // Trigger flash animation
                triggerAlertAnimation();
            } else {
                alertCard.innerHTML = '<h2>Alert</h2><p class="alert-message">Normal Operation</p>';
                alertCard.classList.remove('danger');
            }
        }

    } catch (error) {
        console.error('Error updating info values:', error);
    }
}

// Update chart data
function updateChartData(newData) {
    try {
        if (!chart) throw new Error('Chart not initialized');

        const currentTime = new Date().toLocaleTimeString();
        
        // Update labels
        chart.data.labels.shift();
        chart.data.labels.push(currentTime);
        
        // Update windspeed data
        chart.data.datasets[0].data.shift();
        chart.data.datasets[0].data.push(newData.windspeed);
        
        // Update chart
        chart.update('none'); // Use 'none' mode for better performance
    } catch (error) {
        console.error('Error updating chart data:', error);
    }
}

// WebSocket message handler
wsSensor.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        console.log('Received sensor data:', data);
        
        // Update both chart and info cards
        updateChartData(data);
        updateInfoValues(data);
        
        // Store last values
        dashboardState.lastValues.windspeed = data.windspeed;
    } catch (error) {
        console.error('Error processing WebSocket message:', error);
    }
};

// WebSocket connection handlers
wsSensor.onopen = () => {
    console.log('Connected to sensor WebSocket');
};

wsSensor.onerror = (error) => {
    console.error('WebSocket error:', error);
};

wsSensor.onclose = () => {
    console.log('Disconnected from sensor WebSocket');
    // Implement reconnection logic if needed
    setTimeout(() => {
        console.log('Attempting to reconnect...');
        wsSensor = new WebSocket('ws://localhost:8082');
    }, 5000);
};

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialize any additional UI elements if needed
        console.log('Dashboard initialized');
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});