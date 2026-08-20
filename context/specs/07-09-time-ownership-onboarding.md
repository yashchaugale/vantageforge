# Fast-Track Bundle: Units 07–09

## Goal

Improve the journal’s evidence quality and product readiness by preserving the chart time attached to a Risk/Reward drawing, giving users a local export/storage view, and guiding first-time users through the post-trade workflow.

## Explicit User-Approved Bundle

The user requested the next three units together. All work remains local; there is no broker, cloud, AI API, backend, or permission change.

## Design

- Distinguish capture time from chart-anchor time.
- `capturedAt` remains the existing `timestamp`: when the user pressed Capture Trade.
- `chartAnchorTime` is the timestamp attached to the first valid RR drawing point: the price-action time shown along the TradingView chart’s bottom axis.
- Do not claim to know the real-world moment when the user originally placed the drawing; that is unavailable without live tracking and is intentionally out of scope.
- Data export is initiated only by an explicit user click and includes a complete JSON backup.
- Onboarding is concise and disappears once the trader has at least three records.

## Implementation

### Chart-time capture

- Extract the earliest valid RR drawing point time and normalise seconds/milliseconds to epoch milliseconds.
- Add nullable `chartAnchorTime` and `chartAnchorInterval` fields to schema version 3.
- Render both chart-anchor time and capture time in the trade review, labelled clearly.

### Data ownership

- Expose read-only local storage usage in the dashboard.
- Add an explicit JSON export button that creates a local browser download. Do not add network or download permissions.
- Export only normalised journal records and include export metadata.

### Onboarding

- Show a compact three-step guide while fewer than three records exist.
- Explain finish → capture → review; do not imply automatic trade detection.

## Verify When Done

- [ ] A valid RR point time is saved separately from capture time.
- [ ] Legacy trades safely show unavailable chart time rather than a false value.
- [ ] Export creates a parseable JSON file with metadata and trade records.
- [ ] Storage usage is visible and does not mutate trade data.
- [ ] Onboarding appears for fewer than three records and hides at three or more.
- [ ] No network calls, extra permissions, or live tracking are added.
- [ ] JavaScript syntax checks pass.
