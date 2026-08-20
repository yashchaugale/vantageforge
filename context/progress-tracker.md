# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Product foundation and post-trade capture stabilisation.

## Current Goal

- Fast-track bundle: Units 07–09—chart-anchor timestamps, local data ownership, and first-run onboarding.

## Completed

- Existing Chrome extension foundation: popup, TradingView bridge, screenshot capture, local storage, and dashboard.
- Experimental extension renamed to **VantageForge Experimental**.
- Capture error/loading handling added.
- Dashboard win-rate denominator corrected to use decided trades.
- Product direction resolved: explicit, post-trade-only capture; no broker integration and no live tracking.
- Automatic background tracking disabled from the active product flow.
- Six-file context system and build plan added.
- Unit 01 capture hardening: the content/page bridge now accepts only same-origin RR responses, and malformed Risk/Reward level order is rejected before persistence.
- Unit 01 accepted after manual verification.
- Unit 02 implementation: schema-versioned trade model, legacy-safe normalisation, storage-service-only dashboard persistence, immutable record IDs, and a 9 MB local-storage pre-save guardrail.
- Unit 02 accepted after manual verification.
- Unit 03 implementation: replaced the table-first dashboard with a responsive screenshot-first trade library and keyboard-accessible review modal. Reviews persist result, exit price, notes, and emotions through the storage service.
- Unit 03 accepted after manual verification.
- Fast-track Units 04–06 implementation: schema v2 optional review tags, local trade-library filters, deterministic seven-day weekly review, and a redesigned capture popup.
- Units 04–06 accepted after manual verification.
- Fast-track Units 07–09 implementation: schema v3 chart-anchor timestamps, local usage display, JSON export, and onboarding for the first three journal records.

## In Progress

- Units 07–09 implementation is complete; manual Chrome verification remains.

## Next Up

- Privacy, export, and storage readiness.

## Open Questions

- When more than one Risk/Reward drawing is present, what minimal selection UI best identifies the completed trade without adding meaningful friction?
- Which result fields are required for a useful first weekly review: setup, session, execution quality, emotion, or rule adherence?
- What screenshot retention/compression policy is acceptable before storage limits become a user problem?

## Architecture Decisions

- `chrome.storage.local` and `trades` are the single source of truth for the first product version.
- The extension retains Chrome's least-privilege storage permission and blocks a new capture before storage reaches a 9 MB safety threshold; it never purges existing journal records automatically.
- The product journals completed chart decisions; it does not claim to know broker executions or account P&L.
- No external backend, network call, or data transmission is part of the active product flow.
- TradingView private model access is a prototype integration and must remain isolated behind the page/content bridge.

## Session Notes

- Work only in `/Users/yashchaugale/Desktop/projects/VantageForgeexp`.
- Reload the unpacked extension after each code change before browser testing.
- Syntax checks passed for the most recently modified JavaScript files; end-to-end Chrome testing remains required.
