# Unit 20 — Provider-neutral journal storage

## Scope

Add a provider boundary behind the existing loopback API. Local SQLite remains the default and is wrapped without changing its data contract. Notion is an opt-in provider using server-side credentials, database/data-source discovery, deterministic field mapping, idempotent trade CRUD, bounded metadata cache, and a recoverable outbox for failed writes.

Credentials never enter extension storage, SQLite, URLs, logs, or API responses. Screenshots remain local in this first integration unless a future Notion file-upload implementation is explicitly enabled.

## Acceptance criteria

- Existing local capture, review, search, analytics, patterns, experiments, and AI behavior remains unchanged when the provider is `local`.
- Provider selection and Notion status are available through the loopback API.
- Notion token validation, discovery, schema inspection, and mapping are server-side.
- Notion writes use `VF Trade ID` for idempotency and update the same page during review.
- Failed Notion writes enter a bounded outbox with clear status; complete journal records are not written to SQLite first.
- Notion reads paginate and normalize into the internal trade shape.
- Tokens use OS keyring when available and otherwise remain session-only.

## Explicit limits

OAuth, real-time bidirectional sync, Notion file uploads, historical migration, and provider-aware experiment persistence are deferred follow-up units.
