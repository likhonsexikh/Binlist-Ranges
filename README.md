# BIN/IIN Data Explorer

This web application scans multiple public sources for Bank Identification Number (BIN) or Issuer Identification Number (IIN) data, enriches it using the binlist.net API, and presents it in a clean, searchable interface.

## Features

- **Comprehensive Data**: Aggregates BIN data from multiple CSV sources.
- **Data Enrichment**: Enriches each BIN with details like card scheme, type, brand, country, and bank information using the public [binlist.net](https://binlist.net/) API.
- **Web Interface**: A clean and responsive web UI to view the enriched data.
- **Dynamic Loading**: The frontend fetches data asynchronously and will retry if the initial data scan is still in progress.
- **Containerized**: The entire application is containerized with Docker for easy setup and deployment.
- **Vercel Ready**: Includes a `vercel.json` configuration for seamless deployment to Vercel.

## Technologies Used

- **Backend**: Python, Flask
- **Frontend**: HTML, CSS, JavaScript
- **Data Processing**: Pandas, Requests
- **API Rate Limiting**: ratelimit, backoff
- **WSGI Server**: Gunicorn
- **Containerization**: Docker

## Local Setup & Running

To run this application locally, you need to have [Docker](https://www.docker.com/get-started) installed.

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Build the Docker image:**
    ```bash
    docker build -t bin-checker .
    ```

3.  **Run the Docker container:**
    ```bash
    docker run -p 8000:8000 bin-checker
    ```

4.  **Access the application:**
    Open your web browser and navigate to `http://localhost:8000`.

The initial data scan may take several minutes to complete. The web interface will show a loading message during this time.

## Deployment

This project is configured for deployment on [Vercel](https://vercel.com). Simply connect your Git repository to a new Vercel project, and it will be deployed automatically using the provided `Dockerfile` and `vercel.json` configuration.

## Footer

The footer contains a "Powered by" link as requested, pointing to the specified Telegram user.