# Phase 02 — Canonical intelligence data foundation

## Scope

Establish the provider-neutral schema contract future intelligence engines will consume. This phase adds no market-structure detectors, embeddings, RAG, LLM calls, agents, or dashboard behavior.

## Contract

Existing primitive capture/review fields remain backward compatible. Schema version 4 adds one `intelligence` namespace containing empty, explicitly nullable domains for market context, market structure, setup fingerprint, calculated features, execution, behaviour, rules, historical references, and AI/memory artifacts. Populated derived values must carry provenance (`source`, `confidence`, and `evidence`) where applicable.

## Migration

Browser normalization upgrades legacy records idempotently. SQLite adds `intelligence_json` when absent and upgrades stored schema versions below 4 without deleting existing values. Providers return the same empty intelligence shape when a record has no future intelligence data.

## Out of scope

BOS, CHOCH, liquidity, FVG, trend/regime detection, setup classification, RAG, embeddings, LLM changes, agents, new dashboard functionality, and automatic psychological inference.
