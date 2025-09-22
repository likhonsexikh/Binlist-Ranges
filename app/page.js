'use client';

import { useState, useEffect } from 'react';
import { Page, Text, Table, Spinner, Note } from '@geist-ui/core';

export default function HomePage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to fetch data
    const fetchData = async () => {
      try {
        // First, trigger the scan API. It will either start the scan or return quickly if data exists.
        // We don't need to wait for the scan to complete here, just trigger it.
        // The fetch below will handle polling for the data file.
        fetch('/api/scan');

        // Now, poll for the data file
        let attempts = 0;
        const maxAttempts = 10;
        const interval = 5000; // 5 seconds

        const pollForData = async () => {
          attempts++;
          const response = await fetch('/data/bins.json');
          if (response.ok) {
            const jsonData = await response.json();
            setData(jsonData);
            setLoading(false);
          } else {
            if (attempts < maxAttempts) {
              setTimeout(pollForData, interval);
            } else {
              throw new Error('Failed to load data after multiple attempts. The scan may have failed.');
            }
          }
        };

        pollForData();

      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderPrepaid = (value) => {
    return value ? 'Yes' : 'No';
  };

  const renderCountry = (value) => {
      if (value && value.name) {
          return `${value.name} ${value.alpha2 ? `(${value.alpha2})` : ''}`;
      }
      return '';
  };

  const renderNonVbv = (value) => {
      return value ? <Note type="error" label="Non-VBV" filled small>Yes</Note> : 'No';
  };

  return (
    <Page>
      <Page.Header>
        <Text h1>Binlist Ranges Scanner</Text>
      </Page.Header>
      <Page.Content>
        {loading && (
          <div>
            <Spinner size="large" />
            <Text p>Loading data... The initial scan can take several minutes. This page will automatically refresh.</Text>
          </div>
        )}
        {error && <Note type="error">{error}</Note>}
        {!loading && !error && (
          <Table data={data}>
            <Table.Column prop="bin" label="BIN" />
            <Table.Column prop="enriched.scheme" label="Scheme" />
            <Table.Column prop="enriched.type" label="Type" />
            <Table.Column prop="enriched.brand" label="Brand" />
            <Table.Column prop="enriched.prepaid" label="Prepaid" render={renderPrepaid} />
            <Table.Column prop="enriched.country" label="Country" render={renderCountry} />
            <Table.Column prop="enriched.bank.name" label="Bank" />
            <Table.Column prop="non_vbv" label="Non-VBV" render={renderNonVbv} />
          </Table>
        )}
      </Page.Content>
       <Page.Footer>
          <Text p>
            Powered by <a href="https://t.me/likhonsheikh" target="_blank" rel="noopener noreferrer">Likhon Sheikh</a>
          </Text>
      </Page.Footer>
    </Page>
  );
}
