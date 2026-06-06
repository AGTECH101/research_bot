# History Bot - Deployment Guide

This repository contains a small FastAPI app that fetches Wikipedia summaries and full pages.

Quick local run

1. Create a venv and install dependencies:

```bash
python -m venv .venv
source .venv/bin/activate   # on Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

2. Run locally (dev server with autoreload):

```bash
python main.py
# or
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Heroku-like deploy (Procfile)

1. Ensure `Procfile` and `requirements.txt` are present.
2. Set `USER_AGENT` and other env vars on the host as needed.
3. `git push heroku main` (or follow your host's instructions).

Docker

Build and run:

```bash
docker build -t history-bot:latest .
docker run -p 8000:8000 --env USER_AGENT="YourAgent/1.0" history-bot:latest
```

Notes

- Use environment variables for secrets and configurable settings.
- For production, configure a process manager, proper logging, and monitoring.
