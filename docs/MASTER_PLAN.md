# You Can't Trade — Master Plan

## 1. Vision and principles

Build a personal trading laboratory that answers what actually works for the trader. Compute first, measure honestly, remember evidence, and let AI explain only when useful. Preserve post-trade, broker-independent, local-first operation.

## 2. Complete feature map

Capture, Trade Case Files, deterministic statistics, time/setup/context analysis, Pattern Discovery, Edge Map, Leak Map, Compare, Trading Memory, Experiments, Review, Explore, Data Health, CSV/Excel/Notion import, optional AI, storage providers, export/backup, extension reliability, premium UI, performance, security, beta, and launch.

## 3. Current-state mapping

See `docs/AUDIT.md`. Current code provides capture, review, SQLite, Notion persistence, experiments, deterministic foundations, similarity, and optional AI. It does not yet provide the complete laboratory.

## 4. Product phases

### Phase 0 — Audit, documentation, rebrand plan

**Done when:** current code/test reality, target product, migration inventory, and GitHub procedure are documented without claiming implementation.

### Phase 1 — Architecture reset

Define canonical evidence, provider capabilities, versions, error taxonomy, and migration policy. **Done when:** contracts and fixtures are accepted and old data remains readable.

### Phase 2 — Data foundation

Complete schema, indexes, data health, backup/restore, provenance, and provider contract tests. **Done when:** 10,000 trades are queryable without AI and recoverable from backup.

### Phase 3 — Trade experience

Build the Trade Case File, target navigation, evidence/unknowns, and low-friction review. **Done when:** a completed trade can be captured, inspected, edited, and deleted safely.

### Phase 4 — Deterministic intelligence

Implement statistics, time/setup/context slices, R, drawdown, expectancy, and confidence. **Done when:** every output has reproducible denominators and fixture coverage.

### Phase 5 — Pattern Discovery

Search bounded combinations with sample, baseline, recency, stability, and evidence-strength safeguards. **Done when:** tiny samples cannot appear as verified edges.

### Phase 6 — Edge Map and Leak Map

Expose profitable contexts and measured behavior leaks with underlying trades. **Done when:** every cell/finding is inspectable and uncertainty is visible.

### Phase 7 — Trading Memory

Persist challengeable statements with support, strength, dates, and status. **Done when:** new data can confirm, weaken, or retire memory.

### Phase 8 — Experiments

Track observation, hypothesis, baseline, target sample, window, and result. **Done when:** experiments never claim causation from uncontrolled observations.

### Phase 9 — Review and Explore

Build question-driven Explore and daily/weekly/monthly reviews. **Done when:** the trader receives one evidence-backed next investigation.

### Phase 10 — Imports

CSV, Excel, and Notion preview/mapping/dedupe/rollback. **Done when:** historical data can be imported without silent loss.

### Phase 11 — Optional AI

Evidence-packet explanations, challenge, summaries, provider fallback, freshness, and usage controls. **Done when:** disabling AI leaves core product fully usable.

### Phase 12 — Premium UI

Implement final target IA and calm visual hierarchy without changing domain contracts.

### Phase 13 — Performance and reliability

Indexes, bounded retrieval, background work, screenshot policy, migrations, and 100–10,000 trade benchmarks.

### Phase 14 — Beta

Package local app/extension, onboarding, diagnostics, privacy, backups, and pilot telemetry that does not expose journal content.

### Phase 15 — Paid launch

Only after retention and learning outcomes are demonstrated; then evaluate hosted sync, managed AI, billing, and multi-user security.

## 5. Cost/time estimates

These are planning ranges, not commitments: documentation/audit 2–4 days; contracts/data foundation 1–2 weeks; trade experience and deterministic intelligence 3–6 weeks; discovery/maps/memory/experiments 4–8 weeks; imports/AI/performance/beta 4–8 weeks. Local infrastructure can remain near zero cost; cloud storage, managed AI, domains, distribution, and support become recurring costs only in a public edition.

## 6. Rebrand and GitHub migration

Create a backup, update display/docs/package metadata, retain compatibility aliases, rename the GitHub repository through GitHub settings, update `origin`, verify branch/history, and push normally. Do not force-push or delete the old remote until a clone and application smoke test succeed.

## 7. Master checklist

- [ ] Phase 0: audit, docs, rebrand inventory, GitHub migration runbook
  - [ ] current code/test inventory
  - [ ] contradictions removed or labeled historical
  - [ ] no feature implementation mixed into audit
- [ ] Phase 1: contracts
  - [ ] evidence/provenance/capabilities defined
  - [ ] migrations and compatibility tests
- [ ] Phase 2: data foundation
  - [ ] health, indexes, backup, restore, provider tests
- [ ] Phase 3: trade case file
  - [ ] identity, plan, actual, evidence, reflection, unknowns
- [ ] Phase 4: deterministic intelligence
  - [ ] statistics, time, setup, context, confidence
- [ ] Phase 5: Pattern Discovery
  - [ ] bounded combinations, baseline, sample/stability safeguards
- [ ] Phase 6: Edge/Leak Maps
  - [ ] inspectable cells and supported behavior findings
- [ ] Phase 7: Trading Memory
  - [ ] support, challenge, verification, retirement
- [ ] Phase 8: Experiments
  - [ ] hypothesis and measurement lifecycle
- [ ] Phase 9: Review/Explore
  - [ ] question mapping and review ritual
- [ ] Phase 10: Imports
  - [ ] CSV, Excel, Notion preview/mapping/dedupe/rollback
- [ ] Phase 11: Optional AI
  - [ ] evidence packets, validation, cache, privacy, usage controls
- [ ] Phase 12–15: UI, performance, beta, paid launch
  - [ ] accessibility, browser regression, 10k-trade benchmark, security review, packaging, pilot, launch gates

