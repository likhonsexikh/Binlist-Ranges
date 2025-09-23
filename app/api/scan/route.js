import { NextResponse } from 'next/server';
import axios from 'axios';
import { parse } from 'csv-parse/sync';
import { promises as fs } from 'fs';
import path from 'path';
import binlookup from 'binlookup';

const lookup = binlookup();

// Configuration
const SOURCE_CSV_URLS = [
    "https://github.com/venelinkochev/bin-list-data/raw/refs/heads/master/bin-list-data.csv",
    "https://github.com/iannuttall/binlist-data/raw/refs/heads/master/binlist-data.csv",
    "https://github.com/binlist/data/raw/refs/heads/master/ranges.csv"
];

const NON_VBV_BINS = [
    '430023', '438948', '488893', '426429', '480012',
    '486236', '441297', '401398', '431307', '426428', '416621'
];

const BIN_MIN_LEN = 6;
const BIN_MAX_LEN = 8;
const DATA_FILE_PATH = path.join(process.cwd(), 'public', 'data', 'bins.json');

// --- Main Handler ---
export async function GET(request) {
    // Check if data file already exists
    try {
        await fs.access(DATA_FILE_PATH);
        console.log("Data file already exists. Scan skipped.");
        return NextResponse.json({ message: 'Data already generated. Scan skipped.' }, { status: 200 });
    } catch (error) {
        // File does not exist, proceed with scan
        console.log("Data file not found. Starting scan...");
    }

    try {
        // 1. Fetch and Parse all BINs from CSVs
        let allBins = [];
        const promises = SOURCE_CSV_URLS.map(url => axios.get(url));
        const responses = await Promise.all(promises);

        for (const response of responses) {
            const text = response.data;
            // Simple regex over the whole text is sufficient
            const found = text.match(/\b\d{6,8}\b/g) || [];
            allBins.push(...found);
        }

        const uniqueBins = [...new Set(allBins)].filter(bin => bin.length >= BIN_MIN_LEN && bin.length <= BIN_MAX_LEN);
        console.log(`Found ${uniqueBins.length} unique BIN candidates.`);

        // 2. Enrich BINs using binlookup
        const enrichedResults = [];
        const nonVbvSet = new Set(NON_VBV_BINS);

        for (let i = 0; i < uniqueBins.length; i++) {
            const bin = uniqueBins[i];
            console.log(`[${i + 1}/${uniqueBins.length}] Enriching BIN: ${bin}`);
            try {
                const data = await lookup(bin);
                enrichedResults.push({
                    bin: bin,
                    enriched: data,
                    non_vbv: nonVbvSet.has(bin)
                });
            } catch (err) {
                console.error(`Failed to lookup BIN ${bin}:`, err.message);
                enrichedResults.push({
                    bin: bin,
                    enriched: null,
                    non_vbv: nonVbvSet.has(bin)
                });
            }
        }

        // 3. Save to file
        const dataDir = path.dirname(DATA_FILE_PATH);
        await fs.mkdir(dataDir, { recursive: true });
        await fs.writeFile(DATA_FILE_PATH, JSON.stringify(enrichedResults, null, 2));

        console.log(`Successfully generated data file at ${DATA_FILE_PATH}`);
        return NextResponse.json({ message: 'Scan complete. Data file generated successfully.', count: enrichedResults.length }, { status: 200 });

    } catch (error) {
        console.error("An error occurred during the scan process:", error);
        return NextResponse.json({ message: 'An error occurred during the scan process.', error: error.message }, { status: 500 });
    }
}
