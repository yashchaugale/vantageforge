# Testing Strategy

## Current verification

The current baseline passes all automated tests:

- `npm test`: 8/8 JavaScript tests passing.
- `python -m unittest discover -s tests -p 'test_*.py' -v`: 37/37 Python tests passing.
- Fresh SQLite initialization succeeds in a temporary data directory and creates the expected application tables.
- `git diff --check` passes for the documented changes.

The test suite includes deterministic intelligence, canonical trade normalization, SQLite migration/round-trip compatibility, historical similarity, and AI contract tests.

The JavaScript test suite may emit diagnostic logs for empty/invalid fixtures; these are expected test output and do not represent test failures.

No live browser/provider integration has been run as part of this baseline.

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

