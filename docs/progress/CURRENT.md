# Current Progress

## Current product

Existing VantageForge implementation being documented and rebranded toward **You Can't Trade**, a personal trading laboratory.

## Current architecture

Manifest V3 TradingView extension → loopback FastAPI → provider-neutral storage (SQLite/filesystem or opt-in Notion) → deterministic intelligence → optional provider-neutral AI.

## Current milestone

Phase 0: audit, documentation reset, and rebrand planning.

## Completed in code

- Explicit post-trade capture and screenshots.
- Canonical schema v4 and SQLite migrations.
- Dashboard review/search/filters/analytics.
- Deterministic market/structure foundations and historical similarity.
- Experiments foundation.
- Notion provider, cache/outbox, and schema mapping.
- Ollama/Gemini/OpenAI-compatible AI provider abstraction and AI persistence.

## Partial or experimental

RR path outcomes, TradingView bridge, Notion capability parity, structure-version consolidation, specialist AI, single-call synthesis, journal-level intelligence, and UI target information architecture.

## Broken / known issues

- Three Python AI prompt assertions fail under `python -m pytest`.
- Plain `pytest` has an import-path collection problem.
- No live Chrome, Notion, or model integration test in this audit.
- README/context still use the old product identity and overstate future functionality.

## Next implementation task

Define and test the canonical deterministic intelligence/evidence contract before building Pattern Discovery.

