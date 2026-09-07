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

- **Local provider**: SQLite `trades` and related tables remain the canonical local journal. Every newly captured record uses schema version 4.
- **Notion provider**: the selected Notion data source is canonical; SQLite stores only provider configuration, bounded metadata cache, and retry outbox while Notion is active.
- **`chrome.storage.local` / legacy keys**: legacy experimental live-tracking data may exist but must not drive the post-trade product flow.
- **Screenshot data**: local mode stores files under the personal data directory. Notion mode uploads a captured chart only when the selected schema has the `Chart Screenshot` file property; the Notion workspace then owns that attachment.
- **Experiments**: currently SQLite-backed personal improvement plans with explicit lifecycle state and sample targets; provider-aware persistence is a follow-up unit.
- **AI data**: local model outputs, trade-level AI reviews, journal-level AI memories, and embeddings are stored separately from the canonical trade record with model, prompt, generation, and freshness/version provenance.

- **AI service**: retrieves provider-neutral trade context through the provider boundary and never edits factual trade or authored review columns. AI interprets verified trade facts, deterministic intelligence, and retrieved historical evidence rather than replacing the authoritative calculation layer.

- **AI providers**: cloud providers are the default BYOK path during development and early release; the user supplies and controls their own provider credentials. Ollama is an optional local provider for users who want inference to remain on-device. A future hosted VantageForge AI service may become the default for normal users without changing the provider-neutral domain boundary.

- **AI memory lifecycle**: VantageForge uses incremental intelligence, persistent AI memory, and periodic journal-level synthesis. A trade is analyzed when new evidence requires analysis, and its resulting AI review is persisted and reused rather than regenerated whenever the extension, dashboard, or trade is opened.

- **AI freshness**: AI artifacts carry enough input/version provenance to determine whether an existing analysis remains valid. Unchanged evidence must reuse the stored result. Changes to material trade, deterministic intelligence, historical context, or relevant memory may invalidate the result and permit one new analysis.

- **AI retrieval scope**: AI requests use the current trade plus relevant retrieved historical evidence and compact journal-level memory rather than repeatedly sending the entire trade database to a model.

- **Journal-level synthesis**: broader trading-pattern analysis is a separate, lower-frequency operation. It may run when enough new evidence accumulates or when explicitly requested, rather than on every dashboard open or individual trade view.

- **AI interaction model**: AI review should normally be automatic after sufficient trade evidence is available. The user should not need to repeatedly click a generation action. Explicit re-analysis is an exceptional action and may consume additional provider usage.
- **AI privacy boundary**: cloud AI may receive the verified trade context required for analysis when the user explicitly configures a cloud provider. Credentials remain server-side and are never stored in trade records, extension storage, URLs, logs, or API responses.
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
9. Opening the extension, dashboard, or an already-reviewed trade must not trigger redundant AI generation; unchanged AI inputs must reuse persisted analysis.

10. AI analysis must be incremental: new trades and changed evidence update only the affected intelligence or AI artifacts rather than forcing whole-journal re-analysis.

11. Trade-level AI review and journal-level AI synthesis are separate lifecycles. Trade review may update when material trade evidence changes; broader journal synthesis runs only when its freshness/evidence rules require it or the user explicitly requests it.

12. AI provider availability must never prevent a verified trade from being saved or make the canonical journal dependent on a particular model provider.
