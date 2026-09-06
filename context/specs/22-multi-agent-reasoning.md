# Spec 22 — Multi-Agent Reasoning Layer

## Status

Planned

## Purpose

Define the contract for VantageForge's multi-agent post-trade reasoning layer.

The reasoning layer interprets verified trade data, deterministic intelligence, and retrieved historical evidence. It does not replace the deterministic intelligence engine and does not create or modify factual trade data.

The V1 reasoning pipeline consists of:

1. Structure Analyst
2. Historical Analyst
3. Behavior Analyst
4. Execution Analyst
5. Synthesis Agent

The four specialist agents may run independently. The Synthesis Agent combines their outputs.

---

## Product Rules

### 1. Facts come from the product data layer

Agents must treat these as authoritative:

- recorded trade fields
- authored journal/review fields
- deterministic intelligence
- retrieved historical trade evidence

Agents must never invent missing execution facts, market events, emotions, rules, or outcomes.

### 2. Agents interpret; they do not mutate facts

Agents may produce:

- observations
- interpretations
- comparisons
- questions
- journaling experiments

Agents must not:

- modify the trade record
- modify deterministic intelligence
- create market facts
- create missing execution data
- predict future price movement
- provide trading signals
- provide financial advice
- autonomously execute actions

### 3. Evidence must be traceable

Agent observations should reference the input evidence used to support them.

Unsupported claims should be omitted or explicitly marked as unknown.

### 4. Planned and actual values are different

Agents must distinguish:

- planned entry vs actual entry
- planned stop vs actual stop
- planned target vs actual exit
- planned risk/reward vs actual result
- intended behavior vs recorded behavior

A planned value must never be treated as proof that an execution occurred.

### 5. Null is not evidence

Missing fields mean the information is unavailable.

Agents must not infer a fact from a null or missing field.

---

# Agent Architecture

```text
                         ┌─────────────────────┐
                         │ Verified Trade Data │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │ Deterministic       │
                         │ Intelligence        │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┼────────────────┐
                    │               │                │
              ┌─────▼─────┐   ┌────▼─────┐   ┌─────▼─────┐
              │ Structure │   │Historical│   │ Behavior  │
              │ Analyst   │   │ Analyst  │   │ Analyst   │
              └─────┬─────┘   └────┬─────┘   └─────┬─────┘
                    │              │                │
                    └──────────────┼────────────────┘
                                   │
                            ┌──────▼──────┐
                            │  Execution  │
                            │   Analyst   │
                            └──────┬──────┘
                                   │
                         ┌─────────▼─────────┐
                         │ Synthesis Agent   │
                         └─────────┬─────────┘
                                   │
                         ┌─────────▼─────────┐
                         │ Final AI Insight  │
                         └───────────────────┘