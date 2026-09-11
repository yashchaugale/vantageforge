# Testing Strategy

## Current verification

`npm test` passes 8 tests. `python -m pytest -q` currently reports 33 passing and 3 stale prompt assertion failures. Plain `pytest` additionally exposes an import-path problem. No live browser/provider integration was run in the audit.

## Required layers

1. Pure model and deterministic calculation fixtures.
2. SQLite migration/round-trip/provider contract tests.
3. API route tests using temporary data directories.
4. AI contract tests for valid JSON, truncation, unavailable provider, no invention, and evidence references.
5. Extension bridge fixtures for valid/malformed/multiple RR tools and timezone/anchor boundaries.
6. Browser smoke tests for capture, review, delete, search, storage settings, screenshot rendering, and offline fallback.
7. Performance tests at 100, 500, 1,000, 5,000, and 10,000 trades with AI disabled.

## Definition of reliable

Every displayed number has a reproducible source; unsupported conclusions render as Unknown; a provider outage cannot lose a capture; and an unchanged AI input does not trigger a duplicate generation.

