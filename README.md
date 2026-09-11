# You Can't Trade

> A personal trading laboratory for discovering what actually works.

## What it is

You Can't Trade is the rebranded direction of this existing VantageForge repository. It is a local-first, TradingView-first post-trade journal for discretionary traders. It preserves chart evidence, measures decisions, retrieves comparable history, and is being expanded into an evidence-backed laboratory.

## What is currently implemented

- Explicit post-trade TradingView capture (screenshot, RR levels, chart metadata).
- Schema-versioned canonical trades and SQLite/filesystem persistence.
- Review fields, search, filters, deletion, basic analytics, similar trades, and experiments.
- Deterministic market/context/structure foundations and temporal anchoring.
- Opt-in Notion persistence with server-side credentials, schema discovery, cache, and retry outbox.
- Provider-neutral AI integrations for Ollama, Gemini, and OpenAI-compatible APIs.

## Partial, experimental, or planned

Pattern Discovery, Edge Map, Leak Map, durable Trading Memory, question-driven Explore, formal Data Health, CSV/Excel/Notion import, production browser fixtures, and the final You Can't Trade navigation are planned or partial. The specialist multi-agent AI pipeline is experimental; core analytics do not depend on it.

## Product philosophy

> You Can't Trade computes. You Can't Trade measures. You Can't Trade remembers. AI explains.

The product is not a broker integration, live tracker, signal generator, prediction service, or financial adviser. Core value must remain useful with AI disabled.

## Architecture

```text
TradingView extension → loopback FastAPI → SQLite/filesystem or Notion
                      → deterministic intelligence → optional evidence-packet AI
```

The local server binds to `127.0.0.1`. Existing VantageForge storage keys, filenames, IDs, and extension aliases are retained until a compatibility-first migration is implemented.

## Development

Requirements: Python 3.10+ and Node with native ES module support.

```bash
python -m pip install -r requirements.txt
python server.py
```

Then load `extension/` as an unpacked extension at `chrome://extensions`. Runtime SQLite and screenshots are created under `data/` and are intentionally local/ignored.

## Optional AI

Ollama, Gemini, and OpenAI-compatible providers are optional. Configure credentials only through the local service. AI receives verified context when explicitly enabled and never owns factual trade fields. No model is required for deterministic analytics.

## Optional Notion storage

Notion is an opt-in provider in the user's workspace, not an unlimited-storage promise. Connect it through dashboard settings, choose a database/data source, create the mapped fields, and enable it only after the schema is ready. Credentials remain server-side.

## Testing

```bash
npm test
python -m pytest -q
```

At the documentation-reset audit, JavaScript tests pass (8). Python reports 33 passing and 3 stale AI prompt assertion failures; plain `pytest` also has an import-path collection issue. See `docs/AUDIT.md` and `docs/TESTING.md`.

## Privacy and safety

Local mode keeps journal data on the computer. Notion and cloud AI are explicit external transfers. This software does not execute trades, monitor brokers, provide signals, or give personalized financial advice. Trading involves substantial risk.

## Documentation

- `docs/AUDIT.md` — evidence-based current-state audit
- `docs/MASTER_PLAN.md` — definitive future roadmap and checklist
- `docs/PRODUCT.md` — product definition and information architecture
- `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/INTELLIGENCE.md`, `docs/AI.md`
- `docs/progress/` — current state, decisions, and changelog
- `context/` — implementation guardrails and historical build context
