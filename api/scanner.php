<?php

// === CONFIG ===
$sourceCsvUrls = [
    "https://github.com/venelinkochev/bin-list-data/raw/refs/heads/master/bin-list-data.csv",
    "https://github.com/iannuttall/binlist-data/raw/refs/heads/master/binlist-data.csv",
    "https://github.com/binlist/data/raw/refs/heads/master/ranges.csv"
];
$dataDir = __DIR__ . '/../data';
$outputJson = $dataDir . '/bins.json';
$outputCsv = $dataDir . '/bins_enriched.csv'; // For consistency with original script
$enrich = true;
$binMinLen = 6;
$binMaxLen = 8;
$binlistBase = "https://lookup.binlist.net";
$requestTimeout = 8; // seconds
$rateLimitPerSec = 2; // How many enrich requests per second

// === HELPERS ===

function read_remote_csv_to_text(string $url, int $timeout): ?string {
    $context = stream_context_create(['http' => ['timeout' => $timeout]]);
    $content = @file_get_contents($url, false, $context);
    return $content ?: null;
}

function extract_bins_from_text(string $text, int $minLen, int $maxLen): array {
    preg_match_all('/\b\d{' . $minLen . ',' . $maxLen . '}\b/', $text, $matches);
    return $matches[0] ?? [];
}

function call_binlist(string $bin, int $timeout): ?array {
    $url = $binlistBase . '/' . $bin;
    $options = [
        'http' => [
            'header' => "Accept-Version: 3\r\n",
            'timeout' => $timeout,
            'ignore_errors' => true, // To handle 404, 429 etc.
        ],
    ];
    $context = stream_context_create($options);
    $response = @file_get_contents($url, false, $context);

    if ($response === false) {
        return null;
    }

    $status_line = $http_response_header[0];
    preg_match('{HTTP\/\S*\s(\d{3})}', $status_line, $match);
    $status = $match[1];

    if ($status == 200) {
        return json_decode($response, true);
    }
    // We could add more specific handling for 429 (rate limiting) if needed
    return null;
}

function run_scan() {
    global $sourceCsvUrls, $dataDir, $outputJson, $outputCsv, $enrich, $binMinLen, $binMaxLen, $requestTimeout, $rateLimitPerSec;

    if (!is_dir($dataDir)) {
        mkdir($dataDir, 0777, true);
    }

    $allBins = [];
    foreach ($sourceCsvUrls as $url) {
        echo "Downloading CSV from: $url\n";
        $csvText = read_remote_csv_to_text($url, $requestTimeout);
        if ($csvText) {
            // Simple regex over the whole text is sufficient and avoids CSV parsing complexities
            $binsFound = extract_bins_from_text($csvText, $binMinLen, $binMaxLen);
            $allBins = array_merge($allBins, $binsFound);
        }
    }

    $normalized = array_map(function($b) {
        return preg_replace('/\D/', '', $b);
    }, $allBins);

    $uniqueBins = array_values(array_unique($normalized));
    sort($uniqueBins);

    echo "Found " . count($uniqueBins) . " unique BIN candidates.\n";

    $results = [];
    $total = count($uniqueBins);
    foreach ($uniqueBins as $idx => $bin) {
        $rec = [
            "bin" => $bin,
            "note" => "",
            "enriched" => null
        ];
        echo "[$idx/$total] BIN: $bin";

        if ($enrich) {
            try {
                $payload = call_binlist($bin, $requestTimeout);
                if ($payload) {
                    $rec["enriched"] = $payload;
                    $rec["note"] = "enriched_ok";
                    echo " -> enriched\n";
                } else {
                    $rec["note"] = "no_data";
                    echo " -> no_data\n";
                }
            } catch (Exception $e) {
                $rec["note"] = "enrich_error: " . $e->getMessage();
                echo " -> enrich_error: " . $e->getMessage() . "\n";
            }
            // Rate limiting
            usleep((1 / $rateLimitPerSec) * 1000000);
        } else {
            echo "\n";
        }
        $results[] = $rec;
    }

    // Save JSON
    file_put_contents($outputJson, json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

    // Save CSV
    $fp = fopen($outputCsv, 'w');
    $header = ["bin", "scheme", "type", "brand", "prepaid", "country_name", "country_code", "bank_name", "bank_url", "bank_phone", "lookup_note"];
    fputcsv($fp, $header);

    foreach ($results as $r) {
        $en = $r['enriched'] ?? [];
        $country = $en['country'] ?? [];
        $bank = $en['bank'] ?? [];
        $row = [
            "bin" => $r['bin'],
            "scheme" => $en['scheme'] ?? '',
            "type" => $en['type'] ?? '',
            "brand" => $en['brand'] ?? '',
            "prepaid" => isset($en['prepaid']) ? ($en['prepaid'] ? 'true' : 'false') : '',
            "country_name" => $country['name'] ?? '',
            "country_code" => $country['alpha2'] ?? '',
            "bank_name" => $bank['name'] ?? '',
            "bank_url" => $bank['url'] ?? '',
            "bank_phone" => $bank['phone'] ?? '',
            "lookup_note" => $r['note']
        ];
        fputcsv($fp, $row);
    }
    fclose($fp);

    echo "Wrote $outputJson and $outputCsv. Done.\n";
}

// This allows the script to be included without running automatically
if (basename(__FILE__) == basename($_SERVER["SCRIPT_FILENAME"])) {
    run_scan();
}
