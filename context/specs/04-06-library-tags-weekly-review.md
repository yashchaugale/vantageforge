# Fast-Track Bundle: Units 04–06

## Goal

Ship one connected review loop: traders can categorise a captured trade, filter their visual library, and receive a deterministic weekly focus based only on their recorded evidence.

## Explicit User-Approved Bundle

The user requested Units 04–06 together for speed. They share the same record fields and dashboard boundary. No network, AI API, backend, broker, or permission work is included.

## Design

- Keep all new review fields optional.
- Add only four structured fields: setup name, session, plan adherence, and one execution tag.
- Make filtering immediate and local.
- Make the weekly review factual, transparent about small sample sizes, and free of trade signals.
- Redesign the extension popup into a polished, dark capture utility with one clear primary action.

## Implementation

### Record and review tags

- Upgrade new records to schema version 2 while normalising v1 and legacy records safely.
- Add nullable `setup`, `session`, `planAdherence`, and `executionTag` fields.
- Provide controlled values for session, plan adherence, and execution tag; preserve a free-text setup name.

### Trade library filters

- Add local filters for symbol, timeframe, result, setup, and session.
- Populate available filter options from stored records.
- Apply filters to the card library only; top metrics remain global.
- Clearly show the number of matching trades and an empty filtered state.

### Weekly review v1

- Analyse the past seven days of captured trades.
- Prefer recorded execution deviations when at least two exist.
- Otherwise surface a setup or review-completion observation with its sample size.
- Always state when there is insufficient evidence and never produce trade instructions, market predictions, or unsupported psychology claims.

### Popup redesign

- Use the project dark tokens, concise post-trade explanation, status-ready primary Capture Trade control, and a secondary dashboard control.

## Dependencies

- No packages, permissions, network calls, or backend changes.

## Verify When Done

- [ ] New and legacy trades open with safe tag defaults.
- [ ] Review fields save and persist after reopening the dashboard.
- [ ] Every filter returns only matching cards and can be cleared.
- [ ] Weekly review includes a count/sample size and has a useful insufficient-data state.
- [ ] Popup is visually coherent and Capture Trade still works with loading/error states.
- [ ] No `innerHTML`, network call, or Chrome permission change is introduced.
- [ ] JavaScript syntax checks pass.
