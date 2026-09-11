# Storage

## Current

SQLite plus filesystem screenshots is the personal local provider. Notion is an opt-in provider using a server-side token/keyring, selected database/data source, deterministic property mapping, bounded cache, and retry outbox. The API is loopback-only. Runtime data is not a hosted VantageForge service.

## Future

Keep `StorageProvider` provider-neutral. Add explicit capability reporting for analytics, experiments, screenshots, search, and sync. Provide export, import, backup, restore, retention, and migration checks before public release. A future hosted edition can use Postgres without changing the extension/domain contract.

## Privacy

Local is the default. Selecting Notion or a cloud AI provider is an explicit data-transfer decision. Tokens remain server-side and must never appear in extension storage, URLs, logs, or trade records.

