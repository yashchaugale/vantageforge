# You Can't Trade — Target Architecture

## Principles

1. The canonical trade record and deterministic calculations are authoritative.
2. AI is an optional interpretation layer and can never block capture.
3. Provider changes must not change the domain trade contract.
4. Evidence and unknowns must be traceable to records and calculations.
5. Local mode is the default personal privacy boundary.

## Target flow

```text
TradingView extension
  → canonical capture + screenshot
  → storage provider
  → deterministic intelligence
  → retrieval/pattern/memory systems
  → optional evidence-packet AI
  → case file, review, experiments
```

## Layers

- **Capture layer:** explicit TradingView action, page/content bridge, screenshot and RR metadata.
- **Domain layer:** schema-versioned trade, review, intelligence, memory, experiment, and evidence contracts.
- **Deterministic intelligence:** calculations, market context, structure, outcomes, historical aggregation, pattern validation, data health.
- **Persistence:** local SQLite/filesystem first; Notion opt-in; future hosted Postgres adapter only for a public edition.
- **Retrieval:** bounded, relevant historical evidence; never send an uncontrolled whole database to a model.
- **AI:** provider adapter, structured evidence packet, strict output validation, provenance and freshness.
- **Presentation:** Home, Trades, Explore, Review, Memory, Experiments, Import, Settings.

## Current-to-target map

Current extension, FastAPI loopback service, SQLite provider, Notion provider, schema v4 intelligence namespace, basic analytics, similarity, experiments, and AI provider abstraction are foundations. Pattern discovery, Edge/Leak Maps, memory lifecycle, import system, data health, target navigation, and packaging remain planned.
