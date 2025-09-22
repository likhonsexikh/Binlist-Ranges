from flask import Flask, render_template, jsonify, send_from_directory
import json
import os
import threading
from scanner import run_scan

app = Flask(__name__)

# --- Data Generation ---
# We'll run the scan in a separate thread to avoid blocking the app startup
# A better approach for a production app would be a scheduled task (e.g., cron)
# or a background worker (e.g., Celery).

def run_scan_in_background():
    print("Starting BIN scan in the background...")
    try:
        run_scan()
        print("BIN scan finished.")
    except Exception as e:
        print(f"Error during BIN scan: {e}")

# Check if the data file exists. If not, run the scan.
if not os.path.exists(os.path.join('data', 'bins.json')):
    scan_thread = threading.Thread(target=run_scan_in_background)
    scan_thread.start()

# --- Routes ---
@app.route('/api/bins')
def get_bins():
    data_path = os.path.join('data', 'bins.json')
    if os.path.exists(data_path):
        return send_from_directory('data', 'bins.json')
    else:
        return jsonify({"error": "Data not available. The scan might be in progress. Please try again later."}), 404

# --- Main ---
if __name__ == '__main__':
    app.run(debug=True)
