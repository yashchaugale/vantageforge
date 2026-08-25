# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Product foundation, post-trade capture, and premium local-first product experience.

## Current Goal

- Build VantageForge into a calm, private trading-memory and improvement system with evidence-led review and low-friction experiments.

## Completed

- Existing Chrome extension foundation: popup, TradingView bridge, screenshot capture, local storage, and dashboard.
- Experimental extension renamed to **VantageForge**.
- Capture error/loading handling added.
- Dashboard win-rate denominator corrected to use decided trades.
- Product direction resolved: explicit, post-trade-only capture; no broker integration and no live tracking.
- Automatic background tracking disabled from the active product flow.
- Six-file context system and build plan added.
- Unit 01 capture hardening: the content/page bridge now accepts only same-origin RR responses, and malformed Risk/Reward level order is rejected before persistence.
- Unit 01 accepted after manual verification.
- Unit 02 implementation: schema-versioned trade model, legacy-safe normalisation, storage-service-only dashboard persistence, immutable record IDs, and a 9 MB local-storage pre-save guardrail.
- Unit 02 accepted after manual verification.
- Unit 03 implementation: replaced the table-first dashboard with a responsive screenshot-first trade library and keyboard-accessible review modal. Reviews persist result, exit price, notes, and emotions through the storage service.
- Unit 03 accepted after manual verification.
- Fast-track Units 04–06 implementation: schema v2 optional review tags, local trade-library filters, deterministic seven-day weekly review, and a redesigned capture popup.
- Units 04–06 accepted after manual verification.
- Fast-track Units 07–09 implementation: schema v3 chart-anchor timestamps, local usage display, JSON export, and onboarding for the first three journal records.
- Unit 10 implementation: personal SQLite schema, localhost API boundary, screenshot file storage, and extension fallback when the service is unavailable.
- Unit 11 implementation: local Ollama health check, grounded trade-analysis endpoint, persisted AI insight records, and dashboard insight display.
- Unit 11 hardening: upgraded the reflection prompt to v5 and made displayed trade facts fully deterministic. Missing or incorrect AI execution claims can no longer replace database values.

- Unit 16: added selected-trade deletion with confirmation, SQLite review/insight cleanup, screenshot cleanup, and browser-storage fallback.
- Unit 16 UI: added a hover-visible Delete control to each trade card using the same confirmed cleanup flow.
- Unit 16 UI: corrected trade-library ordering so newest captures appear first.

- Unit 17 foundation: added a local AI comparison endpoint that uses verified similar-trade fields and returns one cautious comparison question.
- Unit 17 UI: connected the similar-trade AI comparison to a Compare locally button inside the review modal.
- Unit 18 implementation: applied a cohesive premium VantageForge redesign to the experimental popup and dashboard—tokenized visual system, persistent navigation, Today framing, chart-first cards, responsive review workspace, local/private status, and reduced-motion support. Existing business logic and element contracts were preserved.
- Unit 19 implementation: added SQLite-backed experiments, loopback CRUD routes, dashboard creation flow, lifecycle status controls, and progress measured from reviewed trades recorded after each experiment starts.
- Unit 20 implementation: added provider-neutral LocalStorageProvider and NotionStorageProvider adapters, server-only keyring/session credentials, current Notion database/data-source discovery, deterministic property mapping, idempotent VF Trade ID writes, bounded metadata cache, and a recoverable outbox.
- Unit 20 refinement: expanded the Notion schema with timeframe, exchange, planned/actual R, setup, review tags, chart anchor time/interval, outcome evidence time, source/status, and chart URL fields; Notion date fields now round-trip chart timestamps correctly.
- Unit 20 performance refinement: bounded Notion list reads to the most recent 100 records and replaced full-database scans during updates/deletes with VF Trade ID queries.
- Unit 20 responsiveness refinement: reused a short-lived server-side recent-page cache across dashboard requests and invalidated it after Notion writes/deletes.
- Unit 20 ordering refinement: Notion journal reads now request newest pages first, matching the local trade library.
- Unit 20 latency refinement: cached the selected Notion schema for one minute and clear both schema/page caches after field changes or writes.
- Unit 20 recovery UX: added bounded cache status, clear-cache controls, visible Notion freshness/pending-save messaging, and automatic plus manual outbox retry from Storage settings.

## In Progress

- Unit 20 verification remains: connect a test Notion workspace, select a database/data source, create fields, capture/update a trade, disconnect, and verify local mode remains unchanged.

## Next Up

- Restart/reload verification of the Unit 11 factuality guard with Ollama; Unit 12 local journal text search is implemented, followed by dashboard search UI and optional embeddings.

## Open Questions

- When more than one Risk/Reward drawing is present, what minimal selection UI best identifies the completed trade without adding meaningful friction?
- Which result fields are required for a useful first weekly review: setup, session, execution quality, emotion, or rule adherence?
- What screenshot retention/compression policy is acceptable before storage limits become a user problem?

## Architecture Decisions

- `chrome.storage.local` and `trades` are the single source of truth for the first product version.
- The extension retains Chrome's least-privilege storage permission and blocks a new capture before storage reaches a 9 MB safety threshold; it never purges existing journal records automatically.
- The product journals completed chart decisions; it does not claim to know broker executions or account P&L.
- No external backend, network call, or data transmission is part of the active product flow.
- The local AI provider is model-swappable through `VANTAGEFORGE_AI_MODEL`; Ollama remains a loopback-only optional dependency.
- Unit 12 starts with private SQLite text search so semantic-search groundwork works without downloading another model.
- Unit 12 implementation: local journal search endpoint plus dashboard search field with service-offline fallback over loaded records.
- Unit 12 bug fix: removed a duplicate `searchTimer` declaration that prevented the dashboard script from loading.
- Unit 13 foundation: added a deterministic `/analytics/summary` endpoint for outcomes, actual R, recurring emotions/tags, and sample-size warnings.
- Unit 13 implementation: added the dashboard Pattern Review panel, loaded from the private analytics endpoint with explicit sample-size warnings.
- Unit 13 AI coach: added a local multi-trade coaching endpoint that receives only verified analytics and returns one cautious journaling experiment.
- Unit 13 bug fix: preserved the Pattern Review AI output element while refreshing analytics, so the coach button now displays status and results.
- Unit 13 quality hardening: vague local-model pattern actions now fall back to a concrete experiment derived from missing verified journal fields.
- Unit 14 foundation: added a deterministic similar-trades endpoint scored by shared verified journal fields.
- Unit 14 implementation: added related-record loading and clickable Similar Trades inside the review modal.
- Unit 15 friction reduction: capture now directly infers WIN/LOSS when the observed chart price has reached the planned target or stop; ambiguous captures remain undecided and exit price stays optional.
- Unit 15 accuracy fix: outcome inference now examines candles after the chart anchor and uses the first clear target/stop touch, avoiding current-price-only misclassification after retracement.
- Unit 15 safety fix: removed current-price fallback; automatic WIN/LOSS now requires chart-path evidence, preventing false outcomes after later price movement.
- Unit 15 root-cause fix: corrected the chart-path analyzer’s undefined model reference; chronological stop/target detection can now execute during capture.
- Unit 15 whole-tool revision: outcome scanning now uses the complete candle history loaded on the chart, avoiding narrow anchor-window misses for stop-first setups.
- Unit 15 timezone fix: normalized TradingView chart-wall-clock RR timestamps once so displayed anchor time and outcome-scan start use the chart’s configured timezone.
- Unit 15 timing rule: outcome inference now ignores the RR anchor candle and starts on the next complete candle.
- TradingView private model access is a prototype integration and must remain isolated behind the page/content bridge.

## Session Notes

- This unit is intentionally implemented in the main `/Users/yashchaugale/Desktop/projects/VantageForge` folder; the experimental folder remains the rollback copy.
- Reload the unpacked extension after each code change before browser testing.
- Syntax checks passed for the most recently modified JavaScript files; end-to-end Chrome testing remains required.
