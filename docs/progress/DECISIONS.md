# Decision Log

## Deterministic intelligence is the product core

Core analytics must work without an LLM so results are fast, reproducible, inspectable, and scalable.

## AI is optional

AI adds language and interpretation but introduces cost, latency, privacy, and hallucination risk. It must never block capture or replace factual calculations.

## You Can't Trade is a personal trading laboratory

The product should help a trader discover their evidence-backed edge, leaks, changes, and experiments—not merely store trades or produce generic AI prose.

## Local-first personal edition

SQLite/filesystem is the default. Notion and cloud AI are opt-in providers. Future hosted infrastructure must preserve the domain contract.

## Rebrand is compatibility-first

The display name and repository slug can change, but old storage keys, database files, IDs, credentials, and extension namespaces require additive migration rather than blind replacement.

## Phase 1 implementation decisions

### Canonical trade contract remains stable

The extension's schema-versioned Trade model remains the canonical capture contract. Deterministic intelligence is attached under the existing `intelligence` namespace rather than replacing or reshaping the trade record.

### Legacy AI field remains for compatibility

The legacy `aiAnalysis` field remains in the Trade model because existing stored records may depend on it. New AI artifacts use the namespaced `intelligence.ai` contract and separate persisted AI records where appropriate.

### Deterministic analytics remain provider-neutral

Journal analytics, pattern discovery, and data-health assessment operate on canonical trade data without storage-specific or AI dependencies. They are authoritative for factual calculations and reporting.

### Existing SQLite migration mechanism is retained

The current ordered, idempotent SQL migration system is sufficient for the present schema. Migration-version tracking is deferred until a future non-idempotent schema migration requires it.

### Postgres is a future storage adapter

A future Postgres implementation must preserve the extension's canonical Trade model and provider boundary. Postgres is not introduced into the personal runtime as part of Phase 1.

### Required runtime dependencies are declared explicitly

The Notion storage provider is an active runtime integration, so `notion-client` is a required dependency in `requirements.txt`.

### Phase 1 verification standard

Phase 1 is considered complete only when the existing product remains functional, deterministic and AI responsibilities are separated, tests pass, fresh installation and database initialization work, and documentation reflects the implemented architecture.
