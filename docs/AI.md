# Optional AI Architecture

## Role

AI explains verified evidence. It must not calculate authoritative statistics, invent missing facts, predict price, recommend trades, claim causation, or conceal uncertainty.

## Current providers

The repository contains provider abstractions for Ollama, Gemini, and OpenAI-compatible providers. Credentials are server-side; Ollama can remain on-device. Current specialist agents and synthesis are experimental, while the single-call path reduces provider calls.

## Target evidence packet

```text
trade facts
deterministic findings
retrieved comparable trades
pattern evidence
data-quality warnings
unknowns
```

The model returns a concise explanation, observations, action for better measurement/documentation, unknowns, and evidence references. Output is schema-validated and persisted with provider/model/prompt/input freshness provenance.

## Trust and cost

The product works with AI disabled. Trade-level explanations are cached and incremental. Journal synthesis is lower frequency. Cloud providers are opt-in BYOK and must show the privacy boundary; local providers are optional and may be slower or unavailable.

