let rowsPerPage = 10;  // Default rows per page
let currentPage = 1;

function formatDateTime(dateTime) {
    const date = new Date(dateTime);
    const day = String(date.getDate()).padStart(2, '0'); // Đảm bảo có 2 chữ số
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Tháng 0-11, cộng thêm 1
    const year = String(date.getFullYear()).slice(-2); // Lấy 2 chữ số cuối của năm
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}:${month}:${year} ${hours}:${minutes}:${seconds}`;
}




// Function to display sensor data in the table
async function displayTableData(page) {
    const response = await fetch('http://localhost:3000/api/sensor-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            currentPage: page,
            rowsPerPage: rowsPerPage
        })
    });

    if (!response.ok) {
        console.error('Error fetching data:', response.statusText);
        return;
    }

    const data = await response.json(); // Parse the JSON response
    const tableBody = document.getElementById('sensor-data-table-body');
    tableBody.innerHTML = '';  // Clear previous data

    data.forEach(sensor => {
        const row = `
            <tr>
                <td>${sensor.lux}</td>
                <td>${sensor.humidity}</td>
                <td>${sensor.temperature}</td>
                <td>${formatDateTime(sensor.datetime)}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });

    document.getElementById('page-info').textContent = `Page ${currentPage}`; // Update this with total pages if needed
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
    currentPage++;
    displayTableData(currentPage);
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

// Initial load
displayTableData(currentPage);
