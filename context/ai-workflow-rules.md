# AI Workflow Rules

## Approach

Build VantageForge incrementally using the context files and a spec-driven workflow. Read `AGENTS.md`, the six context files, and the relevant spec before implementation. Implement only the current feature unit.

## Scoping Rules

- Work on one independently verifiable feature unit at a time.
- A tightly related multi-unit bundle is allowed only when the user explicitly requests it and the bundle is documented in `context/specs/`.
- Prefer a small end-to-end increment over a broad speculative refactor.
- Do not add broker integration, live tracking, cloud sync, AI APIs, or payment features unless a new approved spec explicitly changes scope.
- Do not infer that a TradingView drawing represents a trade.
- Do not change the original VantageForge folder; all work remains in `VantageForgeexp`.

## When to Split Work

Split a change when it combines two or more of:

- TradingView bridge behaviour and dashboard redesign.
- Storage schema/migration and unrelated UI features.
- External services, authentication, or network permissions with core local capture.
- More than one independently testable user workflow.

## Handling Missing Requirements

- Do not invent product behaviour that is absent or ambiguous in the context files.
- Record missing requirements as an open question in `progress-tracker.md`.
- Resolve a material product choice with the user before implementation.
- Make safe implementation assumptions only when they do not expand scope; document them in the progress tracker.

## Protected Boundaries

- Do not alter `manifest.json` permissions or host permissions without explicit user approval.
- Do not connect `server.py` or add network requests without an approved architecture and privacy update.
- Do not modify or delete user journal records as part of a migration without explicit approval and recovery strategy.

## Keeping Docs in Sync

- Update `progress-tracker.md` after each meaningful implementation unit.
- Update `project-overview.md` before implementing a scope change.
- Update `architecture.md` before implementing a storage, privacy, or system-boundary change.
- Update `code-standards.md` when a durable convention changes.

## Before Moving to the Next Unit

1. Verify the unit against its spec checklist.
2. Run available syntax/build checks.
3. Give the user a focused manual test checklist when browser verification is needed.
4. Confirm no architecture invariant was violated.
5. Update `progress-tracker.md`.
