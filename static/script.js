document.addEventListener('DOMContentLoaded', function() {
    const tableBody = document.querySelector('#bins-table tbody');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessage = document.getElementById('error-message');
    const tableContainer = document.querySelector('.table-container');

    const MAX_RETRIES = 5;
    const RETRY_DELAY_MS = 5000; // 5 seconds

    async function fetchData(retries = MAX_RETRIES) {
        try {
            const response = await fetch('/api/bins');

            if (response.status === 404) {
                if (retries > 0) {
                    console.log(`Data not found, retrying in ${RETRY_DELAY_MS / 1000}s... (${retries} retries left)`);
                    setTimeout(() => fetchData(retries - 1), RETRY_DELAY_MS);
                } else {
                    showError();
                }
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            populateTable(data);
            showTable();

        } catch (error) {
            console.error('Error fetching BIN data:', error);
            if (retries > 0) {
                setTimeout(() => fetchData(retries - 1), RETRY_DELAY_MS);
            } else {
                showError();
            }
        }
    }

    function populateTable(data) {
        tableBody.innerHTML = ''; // Clear existing data

        if (!data || data.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 7;
            cell.textContent = 'No BIN data found.';
            row.appendChild(cell);
            tableBody.appendChild(row);
            return;
        }

        data.forEach(item => {
            const en = item.enriched || {};
            const country = en.country || {};
            const bank = en.bank || {};

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.bin}</td>
                <td>${en.scheme || ''}</td>
                <td>${en.type || ''}</td>
                <td>${en.brand || ''}</td>
                <td>${en.prepaid ? 'Yes' : 'No'}</td>
                <td>${country.name || ''} ${country.alpha2 ? `(${country.alpha2})` : ''}</td>
                <td>${bank.name || ''}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    function showTable() {
        loadingIndicator.style.display = 'none';
        errorMessage.style.display = 'none';
        tableContainer.style.display = 'block';
    }

    function showError() {
        loadingIndicator.style.display = 'none';
        errorMessage.style.display = 'block';
        tableContainer.style.display = 'none';
    }

    // Initial fetch
    fetchData();
});
