# You Can't Trade — Repository Audit

Audit date: 2026-09-11
Audited repository: `/Users/yashchaugale/Desktop/projects/YouCantTrade`
Audit scope: current implementation and documentation only. No product features were built in this phase.

## Executive summary

This is a functioning single-user TradingView browser extension backed by a loopback FastAPI service and SQLite. It captures a completed Risk/Reward drawing, screenshot, chart metadata, and a versioned canonical trade record. It has local and opt-in Notion storage, deterministic market/context intelligence, historical similarity retrieval, experiments, and provider-neutral AI integrations (Ollama, Gemini, and OpenAI-compatible providers). The repository also contains a four-specialist plus synthesis AI architecture and a single-call runner.

The code is materially ahead of the older README and vision documents. The current product is not yet the proposed **You Can't Trade personal trading laboratory**: Edge Map, Leak Map, durable Trading Memory, question-driven Explore, robust import workflows, and most journal-level deterministic discovery are planned rather than implemented.

## Current architecture inventory

| Component | Status | Where | What exists | Verification / concern |
|---|---|---|---|---|
| TradingView extension shell | COMPLETE | `extension/manifest.json`, popup, background, content/page scripts | Manifest V3 popup, dashboard, service worker, page/content bridge | Private TradingView model integration is fragile and needs browser regression tests |
| Explicit post-trade capture | PARTIALLY COMPLETE | `extension/services/tradeService.js` | Capture action reads one RR tool, metadata, screenshot, deterministic intelligence, then persists | Multiple RR drawings still have an unresolved selection UX question |
| RR/path outcome inference | EXPERIMENTAL | `extension/page.js`, `tradeService.js` | Directional validation and candle-path stop/target inference after anchor | Depends on private chart data and requires fixture/browser coverage |
| Canonical trade model | COMPLETE | `extension/models/trade.js`, `database/local_database.py` | Schema v4, stable IDs, legacy-safe normalization, namespaced intelligence | Domain contract is not yet documented in one canonical data-model file |
| Local storage | COMPLETE | `database/`, `services/storage/local_provider.py` | SQLite migrations, WAL, screenshot files, CRUD, analytics, similarity, experiments | Runtime data is local/ignored; no tested backup/restore workflow |
| Notion storage | PARTIALLY COMPLETE | `services/storage/notion_*`, `services/storage/factory.py` | Token keyring, database/data-source discovery, schema creation, idempotent VF Trade ID mapping, cache/outbox, screenshot upload support | Depends on evolving Notion API and user-created permissions; provider-wide analytics/experiments remain uneven |
| Storage abstraction | COMPLETE | `services/storage/base.py`, providers | Provider-neutral create/read/update/delete/statistics/similarity contract | Contract needs explicit capability matrix for provider-specific gaps |
| Deterministic intelligence | PARTIALLY COMPLETE | `extension/intelligence/` | Candle normalization, market stats/regime, structure engines, setup fingerprints, temporal anchoring, validation | Structure versions v11–v14 coexist; discovery and statistical safeguards are incomplete |
| Historical retrieval | PARTIALLY COMPLETE | `database/local_database.py`, historical agent | Canonical-context-first similarity and compact historical context | SQLite-focused; no durable memory or confidence/stability model |
| Basic analytics | COMPLETE | `journal_analytics`, `/analytics/summary`, dashboard pattern panel | Outcomes, actual R, emotions/tags, sample warning | Limited dimensions; not the target Edge/Leak Map |
| Experiments | PARTIALLY COMPLETE | database, `/experiments`, dashboard | SQLite-backed lifecycle and reviewed-trade progress | Not provider-aware and not yet connected to hypothesis/evidence framework |
| AI provider abstraction | COMPLETE | `ai/providers`, `ai/provider_factory.py` | Ollama, Gemini, OpenAI-compatible provider contracts and server-side credentials | Cloud configuration UX and production secret policy need formalization |
| Specialist multi-agent AI | EXPERIMENTAL | `ai/agents/` | Structure, historical, behavior, execution, synthesis contracts and runners | Prompt/fixture drift causes three Python assertion failures; expensive and not required for core analytics |
| Single-call AI path | PARTIALLY COMPLETE | `ai/agents/single_call_runner.py`, `ai/service.py` | One constrained synthesis call with deterministic evidence | Not the same as a fully deterministic reasoning engine; invalid output handling needs more fixtures |
| AI persistence | PARTIALLY COMPLETE | `ai/service.py`, database AI tables | Trade insights/reflections with prompt/model provenance | Journal-level memory and freshness lifecycle are not complete |
| Dashboard | PARTIALLY COMPLETE | `extension/dashboard/` | Chart-first library, review modal, search/filtering, metrics, patterns, experiments, storage settings | Target Home/Trades/Explore/Review/Memory/Experiments/Import IA is not implemented |
| Import | PLANNED | — | No verified CSV/Excel import workflow found | Must define mapping, deduplication, screenshots, and validation before building |
| Documentation | BROKEN | `README.md`, `docs/`, `context/` | Useful historical material exists but claims You Can't Trade and conflicts with new direction/current code | Replaced/updated by this documentation reset |

## API surface found

`server.py` exposes loopback routes for health, storage status/outbox/cache/provider selection, Notion connection/discovery/configuration/schema fields, trades CRUD/search/similarity/historical context, screenshots, analytics, experiments, AI health/insights/compare/patterns/analyze/multi-agent. The server binds to `127.0.0.1`; it is not a hosted public API and has no authentication.

## AI architecture: current implementation versus target

### Current implementation

The repository contains specialist contracts (`StructureAnalyst`, `HistoricalAnalyst`, `BehaviorAnalyst`, `ExecutionAnalyst`), an agent runner, synthesis, and a single-call runner. The service supplies deterministic intelligence and historical context to providers. Ollama is the default in `ai/local_ai.py` unless configured otherwise; Gemini and OpenAI-compatible providers are available through the provider factory. AI results are stored separately from factual trade fields.

### Target architecture

The deterministic engine is the product core. `services/canonical_intelligence.py` establishes the deterministic boundary before persistence, while the extension intelligence modules compute market/context, structure, setup, and calculated trade intelligence. Historical similarity and comparable outcomes are deterministic and do not require AI. AI is optional: it explains supplied evidence, challenges a finding, or summarizes a review. A user must be able to use the laboratory with no model installed and no AI API key.

## Test status

Commands run from this folder:

- `python -m unittest discover -s tests -p 'test_*.py' -v`: **PASS — 37 Python tests**.
- `npm test`: **PASS — 8 JavaScript tests**.
- The current verified suite has no Python or JavaScript test failures. Some tests intentionally exercise invalid/empty candle fixtures and therefore produce expected validation output.

No end-to-end Chrome/TradingView test was run. No Ollama/Gemini/Notion live integration test was run during this audit.

## Current development environment

- Python requirements: `fastapi`, `uvicorn`, `keyring`; no `pyproject.toml`, `uv.lock`, or checked-in virtual environment.
- JavaScript: native ES modules and Node's built-in test runner; `package.json` is private and named `you-cant-trade`.
- Runtime configuration is environment-variable/keyring based. No `.env` file was found.
- The repository contains ignored local SQLite files and screenshots. They are runtime data, not release fixtures.
- A shell startup warning (`JAVA_HOME` used as a command in the user's `.zprofile`) is external to this repository.

## Git and GitHub state

- Branch: `main`; working tree clean at audit time.
- Remote: `https://github.com/yashchaugale/you-cant-trade.git`.
- Recent history contains the You Can't Trade AI/storage milestones; history is preserved.
- GitHub repository was renamed to `yashchaugale/you-cant-trade`; display name is `You Can't Trade`.
- No force push, history rewrite, or remote change was performed.

## Rebrand inventory

The old name appears in user-facing UI/manifest, Python/JS identifiers, environment variables, keyring service names, Notion field names, database filenames, comments, tests, and historical docs. These occurrences must not be blindly replaced.

| Category | Examples | Migration rule |
|---|---|---|
| User-facing | popup manifest, dashboard copy, error messages | Change in a dedicated UI rebrand unit |
| Internal compatibility | `window.YouCantTrade`, `you-cant-trade_trade_state` | Keep aliases during migration; add new key with read-old/write-new strategy |
| Environment variables | `YOU_CANT_TRADE_DATA_DIR`, `YOU_CANT_TRADE_AI_MODEL`, Ollama URL | Support both names, document precedence, migrate later |
| Credentials | keyring services `you-cant-trade`, `you-cant-trade-ai` | Never invalidate existing credentials silently |
| Data | `data/you-cant-trade.sqlite3`, Notion `VF Trade ID` | Preserve existing data; rename only with backup/migration |
| Extension namespace | manifest name and `window.YouCantTrade` | Keep bridge compatibility until all scripts are versioned together |
| Historical/docs/tests | all current Markdown and fixture engine labels | Update or label historical; do not rewrite evidence of past implementation |

## Main technical problems

1. Documentation contradicts implementation and new product direction.
2. The automated Python and JavaScript test suites now pass; live browser/provider integration remains unverified.
3. The TradingView bridge depends on private page internals and has no browser fixture harness.
4. Provider capability differences are not surfaced as a formal contract.
5. Deterministic intelligence is powerful but fragmented across versioned structure modules and lacks journal-level pattern validation.
6. No formal backup/restore, import, retention, or migration tooling exists.
7. The current API has no authentication and is safe only because it binds to loopback; packaging must preserve that boundary.
8. Notion and cloud AI integrations can send user data externally when configured; consent and data-flow UX need to be explicit.

## Recommended implementation order

1. Documentation reset and safe rebrand plan (this phase).
2. Canonical data/capability contract and test harness.
3. Deterministic intelligence foundation and data health.
4. Trade Case File and target navigation.
5. Pattern Discovery with sample-size/stability safeguards.
6. Edge Map and Leak Map.
7. Trading Memory and experiments.
8. Explore and Review rituals.
9. CSV/Excel/Notion import and migration tools.
10. Optional evidence-packet AI.
11. Performance, backup, security, packaging, beta, and paid launch.
