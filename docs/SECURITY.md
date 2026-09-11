# Security and Privacy

## Current boundary

FastAPI binds to `127.0.0.1`, has no authentication, and relies on same-machine access. This is appropriate only for personal local use. Notion and cloud AI are opt-in external transfers. Keyring credentials are server-side.

## Required before public release

Authentication and authorization, encrypted transport, secret rotation, tenant isolation, audit logging without sensitive payloads, rate limiting, upload validation, dependency scanning, threat modeling, backup encryption, deletion/export controls, and explicit consent for each external provider.

## Product safety

No signals, execution, broker tracking, or personalized financial advice. AI output must be clearly labeled as interpretation and uncertainty.

