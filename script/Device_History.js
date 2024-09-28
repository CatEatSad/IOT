// Simulated data (replace this with actual data later)
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

// Pagination settings
let rowsPerPage = 10;  // Default rows per page
let currentPage = 1;

// Function to display data in the table
function displayTableData(page) {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = deviceHistory.slice(startIndex, endIndex);

    const tableBody = document.getElementById('history-table-body');
    tableBody.innerHTML = ''; // Clear previous data

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

    document.getElementById('page-info').textContent = `Page ${currentPage} of ${Math.ceil(deviceHistory.length / rowsPerPage)}`;
}

// Function to go to the previous page
document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        displayTableData(currentPage);
    }
});

// Function to go to the next page
document.getElementById('next-btn').addEventListener('click', () => {
    if (currentPage * rowsPerPage < deviceHistory.length) {
        currentPage++;
        displayTableData(currentPage);
    }
});

// Handle rows per page change
document.getElementById('rows-per-page').addEventListener('change', (event) => {
    rowsPerPage = parseInt(event.target.value);  // Update rows per page
    currentPage = 1;  // Reset to the first page
    displayTableData(currentPage);
});

// Initial load
displayTableData(currentPage);