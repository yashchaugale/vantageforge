# Unit 11: Personal Local AI Layer

## Goal

Let the personal journal produce a grounded post-trade reflection using a model running on the user's own computer.

## Design

- VantageForge uses a provider-neutral AI service so the model provider can change without changing the trade domain or browser capture flow.
- Cloud AI is the default BYOK path. The user supplies and controls their own provider API key.
- VantageForge does not pay for or proxy user AI inference costs.
- Ollama is an optional local provider for users who want inference to remain on-device.
- Cloud providers may receive only the verified trade context required for the requested AI analysis, and only after the user explicitly configures that provider.
- AI credentials remain server-side and are never stored in trade records, extension storage, URLs, logs, or API responses.
- AI analysis uses verified trade data and deterministic intelligence as its factual source of truth.
- AI must not invent execution facts, market facts, emotions, notes, outcomes, or other missing trade information.
- AI must not provide trading signals, predictions, entry or exit instructions, or personalised financial advice.
- Every generated insight is stored separately from `trades` and `trade_reviews` with model and prompt-version provenance.
- If the configured AI provider is unavailable, the journal remains fully usable and explains the failure.

## Verify When Done

- [ ] AI health reports the configured provider and model availability.
- [ ] A configured BYOK provider can generate a grounded trade reflection.
- [ ] An analyzed trade creates one persisted `ai_insights` row.
- [ ] The dashboard displays the latest insight without overwriting authored notes.
- [ ] Ollama can be selected as an optional local provider.
- [ ] Missing or invalid provider credentials produce an actionable error.
- [ ] AI provider failures do not break trade capture or review.
- [ ] Cloud AI is never contacted unless the user explicitly configures a cloud provider.
- [ ] AI outputs never replace verified trade facts.
- [ ] No broker connection, prediction language, or autonomous trading behavior is introduced.
