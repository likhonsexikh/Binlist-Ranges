$(document).ready(function() {
    const loadingIndicator = $('#loading-indicator');
    const errorMessage = $('#error-message');
    const tableCard = $('#table-card');
    let dataTable;

    const MAX_RETRIES = 5;
    const RETRY_DELAY_MS = 5000;

    function fetchDataAndInitTable(retries = MAX_RETRIES) {
        // Show loading indicator at the start
        loadingIndicator.show();
        errorMessage.hide();
        tableCard.hide();

        $.ajax({
            url: '/api/index.php', // Path to the PHP API
            dataType: 'json',
            success: function(data) {
                loadingIndicator.hide();
                tableCard.show();

                if (dataTable) {
                    dataTable.clear().rows.add(data).draw();
                } else {
                    dataTable = $('#bins-table').DataTable({
                        data: data,
                        columns: [
                            { data: 'bin' },
                            { data: 'enriched.scheme', defaultContent: '' },
                            { data: 'enriched.type', defaultContent: '' },
                            { data: 'enriched.brand', defaultContent: '' },
                            {
                                data: 'enriched.prepaid',
                                defaultContent: '',
                                render: function(data, type, row) {
                                    return data === true ? 'Yes' : (data === false ? 'No' : '');
                                }
                            },
                            {
                                data: 'enriched.country',
                                defaultContent: '',
                                render: function(data, type, row) {
                                    if (data && data.name) {
                                        return `${data.name} ${data.alpha2 ? `(${data.alpha2})` : ''}`;
                                    }
                                    return '';
                                }
                            },
                            { data: 'enriched.bank.name', defaultContent: '' }
                        ],
                        responsive: true,
                        "language": {
                            "emptyTable": "No BIN data available.",
                            "zeroRecords": "No matching records found"
                        }
                    });
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                // Handle the 202 Accepted case for the initial scan
                if (jqXHR.status === 202 && retries > 0) {
                    console.log(`Data is processing, retrying in ${RETRY_DELAY_MS / 1000}s...`);
                    // Update loading text
                    loadingIndicator.find('strong').text('Scan in progress...');
                    setTimeout(() => fetchDataAndInitTable(retries - 1), RETRY_DELAY_MS);
                } else {
                    loadingIndicator.hide();
                    errorMessage.show();
                }
            }
        });
    }

    fetchDataAndInitTable();
});
