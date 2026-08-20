# Unit 02: Canonical Trade Record and Local Storage Safety

## Goal

Make every newly captured trade use one complete versioned record shape, keep legacy records readable, and prevent screenshot captures from failing silently as Chrome local storage approaches its quota.

## Design

This is a data-boundary unit only. There are no dashboard layout changes, no new permissions, no image compression, and no automatic deletion. A full local store produces a clear error that preserves every existing journal record.

## Implementation

### Canonical trade model

- Define `TRADE_SCHEMA_VERSION = 1` and make `createTrade()` return all supported v1 fields with safe defaults.
- Preserve `timestamp` as the capture-time field for compatibility with the current dashboard.
- Include immutable `id`, `schemaVersion`, `timestamp`, `updatedAt`, chart metadata, screenshot, plan levels, exit/outcome fields, notes, emotions, and reserved nullable fields already used by the product.
- Keep `result` limited to `WIN`, `LOSS`, `BE`, or `null`.

### Normalisation

- Add a pure normaliser in the model boundary.
- `getTrades()` returns only normalised, readable records; it must not rewrite or delete legacy storage merely by reading it.
- `saveTrade()` normalises a new record before persistence and rejects invalid records.
- `updateTrade()` preserves the stored record ID and refreshes `updatedAt`.

### Storage guardrail

- Before appending a new trade, query total local usage with `chrome.storage.local.getBytesInUse(null)`.
- Estimate the proposed record's serialised size and reject the write if current usage plus that estimate would exceed 9 MB.
- Use a dedicated actionable error message: export or remove old screenshots before capturing another trade.
- Allow non-screenshot review updates while space remains; never silently delete or overwrite another record.

## Dependencies

- No new packages and no manifest changes.

## Verify When Done

- [ ] New captures include `schemaVersion: 1` and every v1 field.
- [ ] A legacy record lacking new fields still opens in the dashboard with safe defaults.
- [ ] Invalid record IDs, result values, or non-finite price values are rejected before persistence.
- [ ] An update keeps the original trade ID and advances `updatedAt`.
- [ ] A capture near the 9 MB guardrail fails with an actionable error and leaves prior records untouched.
- [ ] No permission or network change was introduced.
- [ ] JavaScript syntax checks pass.
