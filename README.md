# VantageForge

> Forge Better Decisions

## Vision

VantageForge is an AI-powered trading execution companion that automatically captures, understands, remembers, and analyzes trading decisions to help traders improve over time.

## Status

🚧 Under Development

## Personal local mode

The personal local build can use a disk-backed SQLite journal instead of relying on the browser's small extension storage quota.

From this repository folder:

```bash
python -m pip install -r requirements.txt
uvicorn server:app --host 127.0.0.1 --port 8765
```

Then reload the `extension` folder from `chrome://extensions`. When the local service is running, captures and reviews are stored in `data/vantageforge.sqlite3` and screenshots are stored in `data/screenshots/`. If the service is stopped, the extension falls back to its existing local browser store.

## Personal AI

Install Ollama separately, then install a small local model:

```bash
ollama pull qwen2.5:0.5b-instruct
```

Keep Ollama running alongside the VantageForge service. Open a saved trade, save its review, and choose **Analyze locally**. The result is stored in the local `ai_insights` table.

## Optional Notion storage

VantageForge can use your Notion workspace as the persistent journal. It does not promise unlimited storage, and the Notion token is handled only by the localhost Python service.

1. Install dependencies with `python -m pip install -r requirements.txt`.
2. Start the service with `python server.py`.
3. Reload the extension and open **Settings → Storage**.
4. Choose **Notion**, connect with a Notion connection token, select the shared database and data source, then create the VantageForge fields.
5. Enable Notion storage only after the schema shows a **VF Trade ID** field.

When Notion is selected, VantageForge writes trades directly through the server-side provider. It keeps only bounded metadata and retry state locally; screenshots remain local in this first integration because a reliable Notion file-upload path is not enabled. Disconnecting never deletes Notion pages.
