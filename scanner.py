#!/usr/bin/env python3
"""
scan_binlist.py

Usage:
  python3 scan_binlist.py [--only-country=COUNTRY_CODE] [--min-prepaid]

What it does:
- Downloads the CSV from the provided raw GitHub URLs
- Extracts BIN/IINs (first 6-8 digits), normalizes and dedups
- Optionally enriches each BIN using Binlist public API (set ENRICH=True)
- Writes outputs: bins_enriched.csv and bins.json

Requirements:
  pip install requests pandas ratelimit backoff
"""

import csv
import json
import re
import time
import os
from typing import List, Dict, Optional

import requests
import pandas as pd
from ratelimit import limits, sleep_and_retry
import backoff

# === CONFIG ===
SOURCE_CSV_URLS = [
    "https://github.com/venelinkochev/bin-list-data/raw/refs/heads/master/bin-list-data.csv",
    "https://github.com/iannuttall/binlist-data/raw/refs/heads/master/binlist-data.csv",
    "https://github.com/binlist/data/raw/refs/heads/master/ranges.csv"
]
DATA_DIR = "data"
OUTPUT_CSV = os.path.join(DATA_DIR, "bins_enriched.csv")
OUTPUT_JSON = os.path.join(DATA_DIR, "bins.json")
ENRICH = True  # Set to False if you only want to parse & dedupe
BIN_MIN_LEN = 6
BIN_MAX_LEN = 8
BINLIST_BASE = "https://lookup.binlist.net"
REQUEST_TIMEOUT = 8  # seconds
RATE_LIMIT_PER_SEC = 2  # how many enrich requests per second (Binlist is public; be polite)
MAX_RETRIES = 3

# === helpers ===

def extract_bins_from_text(text: str) -> List[str]:
    """Find sequences of 6-8 digits that might be BINs. Returns normalized strings."""
    candidates = re.findall(r"\d{6,8}", text)
    normalized = [c.lstrip("0") or "0" for c in candidates]  # strip leading zeroes if any
    # enforce length limits again
    normalized2 = [c for c in normalized if BIN_MIN_LEN <= len(c) <= BIN_MAX_LEN]
    return normalized2

def read_remote_csv_to_text(url: str) -> str:
    resp = requests.get(url, timeout=REQUEST_TIMEOUT)
    resp.raise_for_status()
    return resp.text

def read_csv_and_extract_bins_from_dataframe(csv_text: str) -> List[str]:
    # Attempt to read with pandas to preserve CSV semantics
    from io import StringIO
    try:
        df = pd.read_csv(StringIO(csv_text), dtype=str, keep_default_na=False)
    except Exception:
        # fallback: treat as raw text and regex
        return extract_bins_from_text(csv_text)

    bins = []
    for col in df.columns:
        for val in df[col].astype(str).fillna(""):
            bins.extend(re.findall(r"\d{6,8}", val))
    # filter lengths
    bins = [b for b in bins if BIN_MIN_LEN <= len(b) <= BIN_MAX_LEN]
    return bins

# Rate-limited Binlist calls
@sleep_and_retry
@limits(calls=RATE_LIMIT_PER_SEC, period=1)  # calls per second
def call_binlist(bin_str: str) -> Optional[Dict]:
    url = f"{BINLIST_BASE}/{bin_str}"
    headers = {"Accept-Version": "3"}  # recommended by some docs
    resp = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
    if resp.status_code == 200:
        return resp.json()
    elif resp.status_code == 429:
        raise Exception("Rate limited by Binlist (429)")
    else:
        return None

def backoff_on_exception(max_tries=3):
    return backoff.on_exception(backoff.expo, Exception, max_tries=max_tries, factor=2)

@backoff_on_exception(MAX_RETRIES)
def enrich_bin_with_retries(bin_str: str) -> Optional[Dict]:
    return call_binlist(bin_str)

def run_scan(only_country=None, min_prepaid=False):
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)

    all_bins = []
    for url in SOURCE_CSV_URLS:
        print("Downloading CSV from:", url)
        csv_text = read_remote_csv_to_text(url)
        bins_found = read_csv_and_extract_bins_from_dataframe(csv_text)
        if not bins_found:
            print("No BIN-like patterns found. Falling back to raw regex.")
            bins_found = extract_bins_from_text(csv_text)
        all_bins.extend(bins_found)

    # normalize to first 6 digits as canonical BIN (optionally keep longer)
    normalized = [re.sub(r"\D", "", b) for b in all_bins]
    normalized = [b[:8] if len(b) >= 8 else b[:6] for b in normalized]  # keep 6-8
    unique_bins = sorted(set(normalized))

    print(f"Found {len(unique_bins)} unique BIN candidates (6-8 digits).")

    results = []
    for idx, bin_str in enumerate(unique_bins, start=1):
        rec = {
            "bin": bin_str,
            "note": "",
            "enriched": None
        }
        print(f"[{idx}/{len(unique_bins)}] BIN: {bin_str}", end="")
        if ENRICH:
            try:
                payload = enrich_bin_with_retries(bin_str)
                if payload:
                    rec["enriched"] = payload
                    rec["note"] = "enriched_ok"
                else:
                    rec["note"] = "no_data"
                print(" -> enriched")
            except Exception as e:
                rec["note"] = f"enrich_error: {str(e)}"
                print(f" -> enrich_error: {str(e)}")
        else:
            print("")
        results.append(rec)
        # small sleep to be extra polite if enrichment toggled on
        if ENRICH:
            time.sleep(0.2)

    # Filter results based on CLI flags
    if only_country:
        results = [r for r in results if r.get("enriched") and r["enriched"].get("country") and r["enriched"]["country"].get("alpha2") == only_country]
    if min_prepaid:
        results = [r for r in results if r.get("enriched") and r["enriched"].get("prepaid")]

    # Build CSV-friendly rows
    csv_rows = []
    for r in results:
        en = r.get("enriched") or {}
        row = {
            "bin": r["bin"],
            "scheme": en.get("scheme", ""),
            "type": en.get("type", ""),
            "brand": en.get("brand", ""),
            "prepaid": en.get("prepaid", ""),
            "country_name": (en.get("country") or {}).get("name", ""),
            "country_code": (en.get("country") or {}).get("alpha2", ""),
            "bank_name": (en.get("bank") or {}).get("name", ""),
            "bank_url": (en.get("bank") or {}).get("url", ""),
            "bank_phone": (en.get("bank") or {}).get("phone", ""),
            "lookup_note": r["note"]
        }
        csv_rows.append(row)

    # Save CSV and JSON
    df_out = pd.DataFrame(csv_rows)
    df_out.to_csv(OUTPUT_CSV, index=False, quoting=csv.QUOTE_MINIMAL)
    with open(OUTPUT_JSON, "w", encoding="utf8") as jf:
        json.dump(results, jf, indent=2, ensure_ascii=False)

    print(f"Wrote {OUTPUT_CSV} and {OUTPUT_JSON}. Done.")

if __name__ == "__main__":
    # For standalone execution, you can add back argument parsing here
    # or just run with default settings.
    run_scan()
