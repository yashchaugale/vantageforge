# Unit 11: Personal Local AI Layer

## Goal

Let the personal journal produce a grounded post-trade reflection using a model running on the user's own computer.

## Design

- Ollama is accessed only at `127.0.0.1:11434`.
- The prompt contains factual trade fields and the trader's authored review; it asks for reflection, not signals, predictions, or financial advice.
- Every generated insight is stored separately from `trades` and `trade_reviews` with model and prompt-version provenance.
- If Ollama is unavailable, the journal remains fully usable and explains how to start it.

## Verify When Done

- [ ] Local AI health reports whether Ollama is reachable and which models are installed.
- [ ] An analyzed trade creates one persisted `ai_insights` row.
- [ ] The dashboard displays the latest insight without overwriting authored notes.
- [ ] Ollama errors are actionable and do not break capture or review.
- [ ] No external URL, cloud API key, broker connection, or prediction language is introduced.
