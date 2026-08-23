# VantageForge personal database foundation

This directory contains the personal SQLite schema. It is intentionally separate from the Chrome extension runtime.

## Reference database

SQLite is the personal reference database because it is free, serverless, transactional, and stored as one file. Screenshots live in a sibling `screenshots/` directory so the database stays fast and portable. The practical limit is the available disk space, not a hosted quota.

## Apply the schema

1. The local service creates `data/vantageforge.sqlite3` on first start.
2. It applies `migrations/001_initial.sql` automatically.
3. Screenshots are written under `data/screenshots/`.

Start it from the repository root with:

```bash
python -m pip install -r requirements.txt
uvicorn server:app --host 127.0.0.1 --port 8765
```

The service binds only to `127.0.0.1`. A future public edition can migrate this schema to Postgres without changing the extension's trade model.
