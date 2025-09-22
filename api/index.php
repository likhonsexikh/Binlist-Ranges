<?php

// Include the scanner logic
require_once __DIR__ . '/scanner.php';

// Define the path to the data file
$dataDir = __DIR__ . '/../data';
$outputJson = $dataDir . '/bins.json';

// --- Main API Logic ---

// Set the content type to JSON for all responses
header('Content-Type: application/json');
// Allow caching for a certain period to avoid re-scanning on every request
header('Cache-Control: public, max-age=3600'); // Cache for 1 hour

// Check if the data file exists.
if (!file_exists($outputJson)) {
    // If it doesn't exist, run the scan to generate it.
    // Note: This can be a long-running process and might time out on
    // serverless platforms like Vercel's free tier. A better approach
    // for production would be a scheduled task (cron job).

    // Create a placeholder response to send to the client immediately
    // while the scan runs in the background (if possible on the platform)
    // or just to indicate that the process has started.
    http_response_code(202); // Accepted
    echo json_encode(['status' => 'processing', 'message' => 'Data is being generated. Please try again in a few minutes.']);

    // To prevent the request from hanging, we can close the connection
    // and let the script continue executing. This works in some FPM/FastCGI setups.
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    }

    // Now, run the scan.
    try {
        run_scan();
    } catch (Exception $e) {
        // If the scan fails, we should log the error.
        // For now, we can't do much more in this simple setup.
        error_log("Error during initial BIN scan: " . $e->getMessage());
    }
    // The script will exit here after the scan. The user needs to make a new request.
    exit();
}

// If the file exists, serve its content.
$jsonData = file_get_contents($outputJson);

// Check if the file is empty or invalid JSON, which might happen if a scan failed midway.
if ($jsonData === false || json_decode($jsonData) === null) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to read or parse the data file. A scan might be in progress or has failed.']);
    exit();
}

// Serve the JSON data
echo $jsonData;
