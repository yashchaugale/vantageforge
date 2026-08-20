# Unit 01: Reliable Explicit Post-Trade Capture

## Goal

Ensure that a completed trade is journaled only when the trader deliberately presses **Capture Trade**, and that the capture result is accurate or clearly fails.

## Design

The popup retains one primary action. Its loading state prevents duplicate clicks. Failure feedback states what the trader can do next. No live monitoring, tracking status, broker state, or background-created record is shown.

## Implementation

### Capture boundary

- Validate that the active tab is a TradingView page before reading chart data.
- Read page context and a Risk/Reward drawing only after Capture Trade is pressed.
- Prefer the most recently relevant RR candidate where the bridge can establish it; document any remaining ambiguity rather than silently claiming certainty.
- Capture the visible chart screenshot and persist one trade record through `storageService.js`.

### Non-capture behaviour

- Creating, editing, deleting, or price-crossing a drawing must not create, update, or close a trade record.
- The extension service worker must not start a live-tracking workflow.

### Error handling

- Surface an actionable error for a non-TradingView tab, unavailable content script, unavailable chart data, or missing RR drawing.
- Restore the capture button after success or failure.

## Dependencies

- No new packages.

## Verify When Done

- [ ] Editing RR tools without clicking Capture Trade creates no `trades` records.
- [ ] Capture on a non-TradingView tab fails with an actionable message.
- [ ] Capture with no RR drawing fails with an actionable message.
- [ ] Capture with a valid RR drawing creates exactly one trade with screenshot, symbol, timeframe, direction, entry, stop loss, and take profit.
- [ ] Repeated button clicks during capture do not create duplicate records.
- [ ] No live tracking begins after a capture.
- [ ] JavaScript syntax checks pass and there are no extension-console errors during the tested flow.
