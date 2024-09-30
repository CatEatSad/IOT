const sensorData = [
    { brightness: '450 Lux', humidity: '55%', temperature: '22°C', time: '2024-09-03 08:15:30' },
    { brightness: '300 Lux', humidity: '60%', temperature: '20°C', time: '2024-09-03 09:45:00' },
    { brightness: '500 Lux', humidity: '50%', temperature: '24°C', time: '2024-09-03 10:30:45' },
    { brightness: '200 Lux', humidity: '70%', temperature: '23°C', time: '2024-09-03 11:00:15' },
    { brightness: '600 Lux', humidity: '65%', temperature: '21°C', time: '2024-09-03 12:15:00' },
    { brightness: '350 Lux', humidity: '75%', temperature: '19°C', time: '2024-09-03 13:30:00' },
    { brightness: '450 Lux', humidity: '68%', temperature: '22°C', time: '2024-09-03 14:45:00' },
    { brightness: '520 Lux', humidity: '52%', temperature: '24°C', time: '2024-09-03 15:15:00' },
    { brightness: '300 Lux', humidity: '57%', temperature: '20°C', time: '2024-09-03 16:00:00' },
    { brightness: '700 Lux', humidity: '61%', temperature: '25°C', time: '2024-09-03 16:30:00' },
    { brightness: '400 Lux', humidity: '55%', temperature: '23°C', time: '2024-09-03 17:00:00' },
    { brightness: '250 Lux', humidity: '62%', temperature: '21°C', time: '2024-09-03 17:45:00' },
    { brightness: '800 Lux', humidity: '59%', temperature: '26°C', time: '2024-09-03 18:15:00' },
    { brightness: '600 Lux', humidity: '66%', temperature: '22°C', time: '2024-09-03 19:00:00' },
    { brightness: '320 Lux', humidity: '54%', temperature: '20°C', time: '2024-09-03 19:45:00' },
    { brightness: '480 Lux', humidity: '73%', temperature: '24°C', time: '2024-09-03 20:30:00' },
    { brightness: '550 Lux', humidity: '71%', temperature: '23°C', time: '2024-09-03 21:15:00' },
    { brightness: '300 Lux', humidity: '60%', temperature: '20°C', time: '2024-09-03 22:00:00' },
    { brightness: '620 Lux', humidity: '66%', temperature: '25°C', time: '2024-09-03 22:45:00' },
    { brightness: '410 Lux', humidity: '58%', temperature: '21°C', time: '2024-09-03 23:30:00' },
    { brightness: '520 Lux', humidity: '62%', temperature: '24°C', time: '2024-09-03 23:45:00' },
    { brightness: '350 Lux', humidity: '70%', temperature: '19°C', time: '2024-09-04 00:15:00' },
];

let rowsPerPage = 10;  // Default rows per page
let currentPage = 1;

// Function to display sensor data in the table
function displayTableData(page, data = sensorData) {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);

    const tableBody = document.getElementById('sensor-data-table-body');
    tableBody.innerHTML = '';  // Clear previous data

    paginatedData.forEach(sensor => {
        const row = `
            <tr>
                <td>${sensor.brightness}</td>
                <td>${sensor.humidity}</td>
                <td>${sensor.temperature}</td>
                <td>${sensor.time}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });

    document.getElementById('page-info').textContent = `Page ${currentPage} of ${Math.ceil(data.length / rowsPerPage)}`;
}

// Event listener for previous page button
document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        displayTableData(currentPage);
    }
});

// Event listener for next page button
document.getElementById('next-btn').addEventListener('click', () => {
    if (currentPage * rowsPerPage < sensorData.length) {
        currentPage++;
        displayTableData(currentPage);
    }
});

// Event listener for changing rows per page
document.getElementById('rows-per-page').addEventListener('change', (event) => {
    rowsPerPage = parseInt(event.target.value);
    currentPage = 1; // Reset to first page
    displayTableData(currentPage);
});

// Search and filtering functionality
document.getElementById('search-criteria').addEventListener('change', (event) => {
    const searchInput = document.getElementById('search-input');
    const dateRangeContainer = document.getElementById('date-range-container');
    
    if (event.target.value === 'date') {
        searchInput.style.display = 'none';
        dateRangeContainer.style.display = 'flex';
    } else {
        searchInput.style.display = 'block';
        dateRangeContainer.style.display = 'none';
    }
});

document.getElementById('search-btn').addEventListener('click', () => {
    const criteria = document.getElementById('search-criteria').value;
    let filteredData;

    if (criteria === 'date') {
        const startDate = new Date(document.getElementById('start-date').value);
        const endDate = new Date(document.getElementById('end-date').value);
        
        if (startDate > endDate || isNaN(startDate) || isNaN(endDate)) {
            alert('Please enter a valid date range.');
            return;
        }

        filteredData = sensorData.filter(sensor => {
            const sensorTime = new Date(sensor.time);
            return sensorTime >= startDate && sensorTime <= endDate;
        });
    } else {
        const searchValue = document.getElementById('search-input').value.trim().toLowerCase();
        
        filteredData = sensorData.filter(sensor => {
            const value = sensor[criteria].toLowerCase();
            return value.includes(searchValue);
        });
    }

    displayTableData(1, filteredData);
});

// Initial load
displayTableData(currentPage);
