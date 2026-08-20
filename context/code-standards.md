# Code Standards

## General

- Keep modules small and single-purpose.
- Fix the root cause; do not add a workaround that creates a second data path.
- Do not combine UI redesign, storage migration, and TradingView-bridge changes in one feature unit.
- Preserve existing user data when changing a record shape; add a documented migration or backwards-compatible default.
- Use clear user-facing errors. Never show success when capture failed.

## JavaScript

- Use ES modules for extension code.
- Use `const` by default and `let` only for reassignment.
- Validate external values from DOM, page messages, and storage before calculations or persistence.
- Use `Number.isFinite` for numeric market values.
- Prefer `async`/`await` over nested callbacks.
- Keep Chrome API calls behind the relevant service or boundary module.

## Extension and Security

- Treat TradingView page content and `window.postMessage` payloads as untrusted input.
- Do not use untrusted strings with `innerHTML`; use DOM nodes and `textContent` for trade-derived content.
- Request the narrowest Chrome permissions necessary.
- Do not add host permissions, external network calls, telemetry, or data export without an approved spec.

## Styling

- Use CSS custom-property tokens defined in `ui-context.md` for new or redesigned UI.
- Keep the popup focused on one primary action.
- Prefer a visual chart-first review over a dense table-first workflow.
- Ensure buttons expose loading, disabled, success, and error states where relevant.

## Data and Storage

- `trades` is the canonical journal collection.
- A trade ID is immutable after creation.
- Do not store unbounded diagnostic event logs in local storage.
- Before shipping larger screenshot collections, define retention, compression, and export behaviour.

## File Organization

- `extension/models/` — record definitions and pure model helpers.
- `extension/services/` — storage, capture orchestration, and extension API access.
- `extension/dashboard/` — dashboard-only rendering and interactions.
- `extension/page.js` and `extension/content.js` — minimal, documented TradingView bridge code only.
- `context/specs/` — build plan and one scoped spec per implementation unit.
