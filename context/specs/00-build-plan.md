# VantageForge Build Plan

## Unit 01: Reliable Explicit Post-Trade Capture

Make Capture Trade the sole record-creation action, with clear failure states and a deterministic choice of the relevant Risk/Reward drawing. Verify no background action creates a trade.

**Dependency:** Existing extension foundation.

## Unit 02: Canonical Trade Record and Local Storage Safety

Define one durable trade record shape, safe defaults for legacy records, immutable IDs, and screenshot-storage guardrails.

**Dependency:** Unit 01.

## Unit 03: Post-Trade Review UI

Replace the table-first workflow with a chart-first review screen that captures outcome, exit, a short note, and optional structured reflection with minimal friction.

**Dependency:** Unit 02.

## Unit 04: Trade Library and Basic Filters

Add a fast visual library with filtering by symbol, timeframe, result, and later setup tags. Preserve an empty-state path back to Capture Trade.

**Dependency:** Unit 03.

## Unit 05: Setup and Behaviour Tags

Add lightweight, consistent tags for setup, session, execution quality, emotion, and rule adherence. Do not add AI interpretation yet.

**Dependency:** Units 02–04.

## Unit 06: Weekly Review v1

Create an evidence-based review that summarises captured patterns and presents one manually generated, rule-based improvement focus.

**Dependency:** Units 04–05.

## Unit 07: Privacy, Export, and Storage Readiness

Provide local export/import, data retention controls, and a documented privacy model before considering a sellable beta.

**Dependency:** Units 02–06.
