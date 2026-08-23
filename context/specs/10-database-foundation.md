# Unit 10: Scalable Database Foundation

## Goal

Define a durable, AI-ready personal data model without making the extension dependent on a paid service, a broker, or a cloud connection during capture.

## Decision

Use SQLite as the personal reference implementation. Keep the schema provider-neutral so the same records can migrate to Postgres for a public release. Use local AI models and local embeddings; no paid API is required.

## Data boundaries

- `trades` stores factual chart capture and outcome data.
- `trade_reviews` stores the trader's authored reflection and tags.
- `trade_embeddings` stores optional embedding vectors and their model provenance.
- `ai_insights` stores generated summaries with model, prompt version, and source trade IDs.
- Screenshots are referenced by a storage path; image bytes do not live in relational rows.

## Verify When Done

- [ ] The migration creates tables, indexes, and foreign-key constraints.
- [ ] A trade can exist without a review or AI artifact.
- [ ] AI artifacts cannot overwrite factual trade or authored review fields.
- [ ] Embeddings are optional and model-versioned.
- [ ] No external network call, cloud credential, or secret is added in this unit; localhost access is explicitly limited to the personal service.
- [ ] The database grows with available disk instead of Chrome's extension quota.
