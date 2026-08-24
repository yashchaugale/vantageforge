# Unit 19 — Personal experiments

## Scope

Add a persisted, local-first experiment workflow without broker integration or causal claims. An experiment contains one behaviour, hypothesis, sample target, lifecycle status, and progress derived from reviewed trades.

## Acceptance criteria

- Experiments persist in SQLite and are exposed through the loopback API.
- The dashboard has a real current-experiment surface and a lightweight create form.
- Progress is based on reviewed trades since the experiment started.
- Completion is observational: the UI reports behaviour change separately from R/performance.
- Existing capture, review, AI, and trade records remain backward compatible.
