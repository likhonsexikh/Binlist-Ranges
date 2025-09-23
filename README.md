# Binlist Ranges Scanner (Next.js Version)

🚀 A modern, full-stack JavaScript application that:
- Downloads BIN/IIN ranges from multiple GitHub sources.
- Normalizes & deduplicates BINs (6–8 digits).
- Enriches each BIN using the `binlookup` library.
- Adds a "Non-VBV" status based on a predefined list.
- Exposes a JSON API and a responsive frontend table.

## ✨ Features
- **Multi-source BIN ingestion**: Aggregates data from several public repositories.
- **Modern Tech Stack**: Built with Next.js and the App Router.
- **Rich UI**: Frontend built with Geist UI, Vercel's design system.
- **Non-VBV Flag**: Identifies and flags BINs from a custom Non-VBV list.
- **Bengali Font Support**: Integrated 'Kalpurush' font for full Bengali text support.
- **Deployable on Vercel**: Optimized for Vercel with zero-configuration deployment.

## 🛠️ Tech Stack
- **Framework**: Next.js (App Router)
- **Language**: JavaScript, React
- **UI**: Geist UI
- **Package Manager**: pnpm (recommended)
- **Deployment**: Vercel

## Local Development Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies (pnpm is recommended):**
    *Ensure you have pnpm installed. If not, see [pnpm.io](https://pnpm.io/installation).*
    ```bash
    pnpm install
    ```

3.  **Run the development server:**
    ```bash
    pnpm dev
    ```
    The application will be available at `http://localhost:3000`.

4.  **Trigger the data scan:**
    To generate the data, make a `GET` request to the scan API endpoint. You can do this by visiting `http://localhost:3000/api/scan` in your browser. The scan will run in the background on the server. The frontend will automatically poll for the data and display it when ready.

---

👨‍💻 Powered by **Likhon Sheikh**
