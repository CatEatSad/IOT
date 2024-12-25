// Global variables
let rowsPerPage = 10;
let currentPage = 1;
let searchTimeout = null;

// Format date time function
function formatDateTime(dateTime) {
    const date = new Date(dateTime);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

function objectToQueryString(obj) {
    return Object.keys(obj)
        .filter(key => obj[key] !== undefined && obj[key] !== '')
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
        .join('&');
}

// Main function to fetch and display data
async function displayTableData(page) {
    try {
        const searchCriteria = document.getElementById('search-criteria').value;
        const searchInput = document.getElementById('search-input');
        const startDate = document.getElementById('start-date');
        const endDate = document.getElementById('end-date');

        // Prepare search parameters
        const searchParams = {
            currentPage: page,
            rowsPerPage: rowsPerPage,
            searchCriteria: searchCriteria
        };

        // Add appropriate search values based on criteria
        if (searchCriteria === 'date') {
            if (startDate.value) searchParams.startDate = startDate.value;
            if (endDate.value) searchParams.endDate = endDate.value;
        } else if (searchInput.value.trim()) {
            searchParams.searchValue = searchInput.value.trim();
        }

        // Convert parameters to query string
        const queryString = objectToQueryString(searchParams);

        // Fetch data using GET
        const response = await fetch(`http://localhost:3000/api/search-sensor-data?${queryString}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Failed to fetch data');
        }

        // Update table
        const tableBody = document.getElementById('sensor-data-table-body');
        tableBody.innerHTML = '';

        result.data.forEach(sensor => {
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

        // Update pagination info
        const { pagination } = result;
        document.getElementById('page-info').textContent = 
            `Page ${pagination.currentPage} of ${pagination.totalPages} (Total: ${pagination.totalCount})`;
        
        // Update pagination buttons
        document.getElementById('prev-btn').disabled = !pagination.hasPreviousPage;
        document.getElementById('next-btn').disabled = !pagination.hasNextPage;

    } catch (error) {
        console.error('Error:', error);
        // You might want to add error handling UI here
    }
}


// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Search criteria change handler
    document.getElementById('search-criteria').addEventListener('change', function(e) {
        const searchInput = document.getElementById('search-input');
        const dateRangeContainer = document.getElementById('date-range-container');
        
        if (e.target.value === 'date') {
            searchInput.style.display = 'none';
            dateRangeContainer.style.display = 'flex';
        } else {
            searchInput.style.display = 'block';
            dateRangeContainer.style.display = 'none';
        }
    });

    // Search button click handler
    
    document.getElementById('rows-per-page').addEventListener('change', (event) => {
        rowsPerPage = parseInt(event.target.value);
        
        displayTableData(currentPage);
    });

    // Search input handler with debounce
    document.getElementById('search-input').addEventListener('input', function() {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        searchTimeout = setTimeout(() => {
            currentPage = 1;
            displayTableData(currentPage);
        }, 500);
    });

    // Date inputs change handlers
    document.getElementById('start-date').addEventListener('change', function() {
        currentPage = 1;
        displayTableData(currentPage);
    });

    document.getElementById('end-date').addEventListener('change', function() {
        currentPage = 1;
        displayTableData(currentPage);
    });

    // Pagination button handlers
    document.getElementById('prev-btn').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            displayTableData(currentPage);
        }
    });

    document.getElementById('next-btn').addEventListener('click', function() {
        currentPage++;
        displayTableData(currentPage);
    });

    // Initial load
    displayTableData(1);
});