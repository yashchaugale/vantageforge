# Unit 03: Chart-First Post-Trade Review

## Goal

Replace the dashboard table with a visual trade library and a focused review panel so a trader can recognise a completed setup from its chart and finish a review in under a minute.

## Design

- Dark, calm workspace using tokens from `ui-context.md`.
- Dashboard header: product name, short purpose statement, and compact summary metrics.
- Trade library: responsive screenshot-first cards, newest first. Each card shows symbol, direction, timeframe, outcome, date, and planned R.
- Empty state: explains the post-trade Capture Trade flow; no fake data.
- Review modal: screenshot first; key levels and R values second; outcome, exit price, notes, and emotions last.
- Use semantic controls, keyboard-accessible cards, visible focus states, and an Escape key to close the modal.

## Implementation

### Dashboard shell and styles

- Replace the table-first HTML/CSS with dashboard-specific stylesheet and semantic layout.
- Use CSS custom properties from `ui-context.md`.
- Support narrow windows without horizontal scrolling.

### Trade library

- Render all stored trades through `getTrades()`.
- Build cards using DOM APIs and `textContent`; do not render trade-derived content with `innerHTML`.
- Make each card open the corresponding review modal by click or Enter/Space.

### Review and save

- Display screenshot, chart metadata, planned levels, planned R, actual R, and result.
- Let the user select WIN, LOSS, or BE; set exit price; add notes and comma-separated emotions.
- Validate exit price when supplied and persist only through `updateTrade()`.
- Refresh cards and summary metrics after a successful save.

## Dependencies

- No new packages.

## Verify When Done

- [ ] Empty dashboard explains how to capture a completed trade.
- [ ] Captured trades render as screenshot-first cards with correct metadata.
- [ ] Card selection opens the matching review and shows correct screenshot/levels.
- [ ] WIN, LOSS, BE, exit price, notes, and emotions save and survive reopening the dashboard.
- [ ] Summary metrics update after save.
- [ ] Card and modal controls work with keyboard.
- [ ] No trade-derived content is inserted through `innerHTML`.
- [ ] JavaScript syntax checks pass.
