# Data Model

## Current canonical trade

The extension and SQLite normalize a schema-versioned record with stable immutable `id`, capture/update timestamps, source, symbol, timeframe, exchange, direction, entry, stop loss, take profit, optional exit price/result, chart anchor, URL, screenshot path, review fields (setup/session/plan adherence/execution tag/notes/emotions), and an `intelligence` namespace. Current schema version is 4.

The `intelligence` namespace contains market context, market structure, setup fingerprint, calculated features/provenance, execution, behavior, rules, historical retrieval, and AI references. Empty fields are intentionally null/empty until an evidence-producing engine populates them.

## Separate records

Trade facts, authored review, deterministic intelligence, AI reflections, experiments, storage outbox jobs, and credentials must remain separate. AI must not overwrite authored or factual fields. Trade IDs are immutable.

## Future records

Add explicit contracts for `EvidenceReference`, `PatternFinding`, `MemoryStatement`, `Experiment`, and `DataHealthReport`. Each derived record must include source trade IDs, sample size, computation version, first/last observed dates, and uncertainty.

## Migration rules

Preserve legacy browser keys, SQLite files, Notion IDs, and screenshots. Use additive migrations, backups, idempotency, and read-old/write-new compatibility. A rebrand must never silently delete or duplicate trades.

