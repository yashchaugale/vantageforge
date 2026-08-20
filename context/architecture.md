# Architecture Context

## Stack

| Layer | Technology | Role |
| --- | --- | --- |
| Browser extension | Chrome Manifest V3 | Hosts the popup, content scripts, dashboard, and service worker. |
| UI | Vanilla HTML, CSS, and JavaScript modules | Popup and dashboard interfaces. |
| TradingView bridge | Isolated content script plus MAIN-world page script | Reads page context and Risk/Reward data that the isolated script cannot access directly. |
| Local persistence | `chrome.storage.local` | Stores trade metadata and screenshots for the current single user. |
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
- `server.py` — inactive prototype only; do not connect it without an approved backend spec.
- `context/` — product decisions, standards, specs, and build state.

## Storage Model

- **`chrome.storage.local` / `trades`**: canonical local journal records, including metadata, review fields, structured tags, chart-anchor time, and screenshot data. Every newly captured record uses schema version 3; legacy records are normalised in memory with safe defaults.
- **`chrome.storage.local` / legacy keys**: legacy experimental live-tracking data may exist but must not drive the post-trade product flow.
- **Screenshot data**: currently stored as data URLs. The extension uses a 9 MB pre-save guardrail against Chrome's 10 MB local-storage quota and never deletes existing records automatically. Compression, retention controls, and export belong to a later unit.
- **Server storage**: none. No user data is currently sent to the FastAPI prototype.
- **Local export**: a user-initiated dashboard action can create a JSON backup in the browser. It does not transmit data or require a Chrome download permission.

## Auth and Access Model

- Version one has no authentication and one local browser user.
- Journal records never leave the browser unless the user explicitly initiates a future export or sync feature.
- Any future sync, collaboration, or AI processing requires a separate architecture and privacy spec before implementation.

## Invariants

1. Only an explicit **Capture Trade** action creates a journal record; TradingView drawings alone never do.
2. The extension is post-trade only: it must not monitor, execute, infer, or claim a live broker trade.
3. The product must not present trading signals, predictions, or personalised financial advice.
4. All persistent trade reads and writes go through `storageService.js`; no feature creates an independent competing trade history.
5. TradingView DOM/private-model failures must produce a clear capture error, never a silently incorrect record.
6. User data remains local by default; no network transmission may be added without an explicit product and privacy decision.
