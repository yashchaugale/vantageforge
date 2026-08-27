# Architecture Context

## Stack

| Layer | Technology | Role |
| --- | --- | --- |
| Browser extension | Chrome Manifest V3 | Hosts the popup, content scripts, dashboard, and service worker. |
| UI | Vanilla HTML, CSS, and JavaScript modules | Popup and dashboard interfaces. |
| TradingView bridge | Isolated content script plus MAIN-world page script | Reads page context and Risk/Reward data that the isolated script cannot access directly. |
| Storage boundary | `services.storage.StorageProvider` | Provider-neutral journal operations used by the API/domain layer. |
| Local persistence | SQLite + filesystem | Durable personal journal database and screenshot files on the user's computer. |
| Notion persistence | Server-side Notion provider | Opt-in persistent journal in the user's Notion workspace. |
| Extension cache | `chrome.storage.local` | Temporary offline fallback while the local service is unavailable. |
| Future public database | Postgres-compatible adapter | Migration target for multi-user release; not part of the personal runtime. |
| Backend | FastAPI | Loopback-only domain and provider boundary; the browser never calls external storage APIs. |

## System Boundaries

- `extension/popup.*` — starts an explicit post-trade capture and opens the dashboard.
- `extension/services/tradeService.js` — orchestration of one capture operation.
- `extension/services/contentService.js` — requests chart context through the content-script boundary.
- `extension/content.js` — bridge between extension code and page-world script.
- `extension/page.js` — reads TradingView-specific chart and Risk/Reward data; this integration is fragile and must fail safely.
- `extension/models/` — canonical record shapes and calculation-adjacent models.
- `extension/services/storageService.js` — all reads and writes of journal records.
- `extension/dashboard/` — trade list, review UI, and local metrics.
- `server.py` — personal localhost API boundary; it selects a provider through `StorageProvider` and binds to loopback only.
- `services/storage/` — provider interface, local adapter, Notion adapter, credentials, cache, and outbox.
- `context/` — product decisions, standards, specs, and build state.

## Storage Model

- **Local provider**: SQLite `trades` and related tables remain the canonical local journal. Every newly captured record uses schema version 3.
- **Notion provider**: the selected Notion data source is canonical; SQLite stores only provider configuration, bounded metadata cache, and retry outbox while Notion is active.
- **`chrome.storage.local` / legacy keys**: legacy experimental live-tracking data may exist but must not drive the post-trade product flow.
- **Screenshot data**: local mode stores files under the personal data directory. Notion mode uploads a captured chart only when the selected schema has the `Chart Screenshot` file property; the Notion workspace then owns that attachment.
- **Experiments**: currently SQLite-backed personal improvement plans with explicit lifecycle state and sample targets; provider-aware persistence is a follow-up unit.
- **AI data**: local model outputs and embeddings are stored in separate SQLite tables with model and prompt provenance.
- **Local AI service**: retrieves provider-neutral trade context through the provider boundary, calls Ollama only on loopback, and never edits factual trade or authored review columns.
- **Canonical intelligence contract**: schema version 4 adds a namespaced `intelligence` object for future market context, market structure, setup fingerprints, execution, behaviour, rules, historical references, calculated features, and AI/memory artifacts. Empty values remain null/empty until an evidence-producing engine exists.

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
6. User data remains local by default; Notion transmission is opt-in, server-side, and visible in storage settings.
7. AI-generated artifacts are clearly separated from the trader's original capture and review, with model and provenance metadata.
8. A provider may be changed without changing the domain trade shape or browser capture code.
