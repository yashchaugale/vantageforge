# Architecture Context

## Stack

| Layer | Technology | Role |
| --- | --- | --- |
| Browser extension | Chrome Manifest V3 | Hosts the popup, content scripts, dashboard, and service worker. |
| UI | Vanilla HTML, CSS, and JavaScript modules | Popup and dashboard interfaces. |
| TradingView bridge | Isolated content script plus MAIN-world page script | Reads page context and Risk/Reward data that the isolated script cannot access directly. |
| Local persistence | SQLite + filesystem | Durable personal journal database and screenshot files on the user's computer. |
| Extension cache | `chrome.storage.local` | Temporary offline fallback while the local service is unavailable. |
| Future public database | Postgres-compatible adapter | Migration target for multi-user release; not part of the personal runtime. |
| Backend prototype | FastAPI | Exists as an unconnected development prototype; it is not part of the product flow. |

## System Boundaries

- `extension/popup.*` — starts an explicit post-trade capture and opens the dashboard.
- `extension/services/tradeService.js` — orchestration of one capture operation.
- `extension/services/contentService.js` — requests chart context through the content-script boundary.
- `extension/content.js` — bridge between extension code and page-world script.
- `extension/page.js` — reads TradingView-specific chart and Risk/Reward data; this integration is fragile and must fail safely.
- `extension/models/` — canonical record shapes and calculation-adjacent models.
- `extension/services/storageService.js` — all reads and writes of journal records.
- `extension/dashboard/` — trade list, review UI, and local metrics.
- `server.py` — personal localhost API boundary for SQLite; it must bind to loopback and never become an internet-facing service.
- `context/` — product decisions, standards, specs, and build state.

## Storage Model

- **SQLite `trades` and related tables**: canonical personal journal records, reviews, embeddings, and AI insights. Every newly captured record uses schema version 3; the extension cache is not a competing source of truth once the local service is running.
- **`chrome.storage.local` / legacy keys**: legacy experimental live-tracking data may exist but must not drive the post-trade product flow.
- **Screenshot data**: stored as files under the personal data directory, with only a relative path in SQLite. This avoids putting a growing image archive in Chrome storage.
- **Experiments**: SQLite-backed personal improvement plans with explicit lifecycle state and sample targets.
- **AI data**: local model outputs and embeddings are stored in separate SQLite tables with model and prompt provenance.
- **Local AI service**: `server.py` calls Ollama only on loopback and writes generated insight text to `ai_insights`; it never edits factual trade or authored review columns.

## Auth and Access Model

- Version one has no authentication and one local browser user.
- Journal records never leave the browser unless the user explicitly initiates a future export or sync feature.
- The local service binds to `127.0.0.1` only; it is not an internet-facing server.
- A future public sync adapter requires a separate authentication, privacy, and migration spec; it must not change the personal database contract.

## Invariants

1. Only an explicit **Capture Trade** action creates a journal record; TradingView drawings alone never do.
2. The extension is post-trade only: it must not monitor, execute, infer, or claim a live broker trade.
3. The product must not present trading signals, predictions, or personalised financial advice.
4. All persistent trade reads and writes go through `storageService.js`; no feature creates an independent competing trade history.
5. TradingView DOM/private-model failures must produce a clear capture error, never a silently incorrect record.
6. User data remains local by default; no network transmission may be added without an explicit product and privacy decision.
7. AI-generated artifacts are clearly separated from the trader's original capture and review, with model and provenance metadata.
