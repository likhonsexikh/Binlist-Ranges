# Binlist Ranges Scanner

🚀 A Flask + Python powered tool that:
- Downloads BIN/IIN ranges from multiple GitHub sources
- Normalizes & deduplicates BINs (6–8 digits)
- Optionally enriches each BIN with [Binlist API](https://binlist.net)
- Exposes a JSON API + frontend table

## Features
- Multi-source BIN ingestion
- CLI filters (`--only-country`, `--min-prepaid`)
- Mobile-friendly responsive UI
- Open Graph SEO for social sharing
- Deployable on **Vercel**

## Tech Stack
- Backend: Flask + Pandas + Requests
- Frontend: HTML + Vanilla JS + Font Awesome
- Deployment: Vercel (@vercel/python)

## Local Run
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

## Vercel Deploy

1. Connect repo on Vercel
2. Add `vercel.json`
3. Deploy → done!

## Metadata
- `og:title`: Binlist Ranges Scanner
- `og:image`: `static/preview.png`
- `og:url`: `https://binlist-ranges.vercel.app/`

---

👨‍💻 Powered by @likhonsheikh