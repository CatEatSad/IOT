const deviceHistory = [
    { id: '001', name: 'Fan', time: '2024-09-03 14:23:45', action: 'On' },
    { id: '002', name: 'Air Conditioner', time: '2024-09-03 15:10:30', action: 'Off' },
    { id: '003', name: 'Light', time: '2024-09-03 16:05:20', action: 'On' },
    { id: '004', name: 'Fan', time: '2024-09-03 17:45:15', action: 'Off' },
    { id: '005', name: 'Fan', time: '2024-09-03 18:00:10', action: 'On' },
    { id: '006', name: 'Light', time: '2024-09-03 18:30:00', action: 'Off' },
    { id: '007', name: 'Fan', time: '2024-09-03 19:00:15', action: 'Off' },
    { id: '008', name: 'Air Conditioner', time: '2024-09-03 20:05:45', action: 'On' },
    { id: '009', name: 'Light', time: '2024-09-03 21:00:30', action: 'Off' },
    { id: '010', name: 'Fan', time: '2024-09-03 21:30:10', action: 'On' },
    { id: '011', name: 'Light', time: '2024-09-03 22:00:00', action: 'On' },
    { id: '012', name: 'Fan', time: '2024-09-03 23:00:45', action: 'Off' },
    { id: '013', name: 'Air Conditioner', time: '2024-09-03 23:30:25', action: 'On' },
    // Additional data can go here...
];


let filteredHistory = [...deviceHistory];  // This will hold the filtered data
let rowsPerPage = 10;  // Default rows per page
let currentPage = 1;

function displayTableData(page) {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = filteredHistory.slice(startIndex, endIndex);

    const tableBody = document.getElementById('history-table-body');
    tableBody.innerHTML = '';  // Clear previous data

    paginatedData.forEach(device => {
        const row = `
            <tr>
                <td>${device.id}</td>
                <td>${device.name}</td>
                <td>${device.time}</td>
                <td class="${device.action.toLowerCase()}">${device.action}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });

    document.getElementById('page-info').textContent = `Page ${currentPage} of ${Math.ceil(filteredHistory.length / rowsPerPage)}`;
}

function filterHistoryByDateRange() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    if (startDate && endDate) {
        const startTimestamp = new Date(startDate).getTime();
        const endTimestamp = new Date(endDate).getTime();

        // Check if the start date is after the end date
        if (startTimestamp > endTimestamp) {
            alert("Invalid date range! The start date cannot be after the end date.");
            return; // Exit the function without applying the filter
        }

        // Proceed with filtering
        filteredHistory = deviceHistory.filter(device => {
            const deviceTime = new Date(device.time).getTime();
            return deviceTime >= startTimestamp && deviceTime <= endTimestamp;
        });
    } else {
        filteredHistory = [...deviceHistory];  // Reset to full data if no range is selected
    }

    currentPage = 1;  // Reset to first page
    displayTableData(currentPage);
}


document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        displayTableData(currentPage);
    }
});

document.getElementById('next-btn').addEventListener('click', () => {
    if (currentPage * rowsPerPage < filteredHistory.length) {
        currentPage++;
        displayTableData(currentPage);
    }
});

document.getElementById('rows-per-page').addEventListener('change', (event) => {
    rowsPerPage = parseInt(event.target.value);
    currentPage = 1;
    displayTableData(currentPage);
});

document.getElementById('filter-btn').addEventListener('click', filterHistoryByDateRange);

// Initial load
displayTableData(currentPage);
