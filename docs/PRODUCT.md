# You Can't Trade — Product Definition

## What it is

**You Can't Trade** is a personal trading laboratory for discretionary traders. It captures completed TradingView decisions, preserves the visual and structured evidence, measures what actually happened, and helps the trader discover what works for them.

## What it is not

- Not a broker, exchange, portfolio, or P&L tracker.
- Not live-trade monitoring or order execution detection.
- Not a signal generator, prediction engine, or financial adviser.
- Not an AI requirement: core value must work without a model.

## Product philosophy

> You Can't Trade computes. You Can't Trade measures. You Can't Trade remembers. AI explains.

The product loop is:

```text
TRADE → CAPTURE → OBSERVE → MEASURE → FIND PATTERN → FORM HYPOTHESIS
→ RUN EXPERIMENT → MEASURE → LEARN → UPDATE MEMORY → TRADE AGAIN
```

## Primary user

Discretionary TradingView users, especially price-action/ICT/SMC traders with roughly 1–5 years of experience who already collect screenshots but do not consistently convert them into learning. Their success criterion is repeated use without journaling feeling like administrative work.

## Positioning

The product is not another feature-heavy journal. It is an evidence-backed laboratory for answering: **What actually works for this trader?** The differentiator is deterministic, inspectable learning from the trader's own decisions, with private/local operation and optional AI explanation.

## Target information architecture

| Section | Job |
|---|---|
| Home | Answer what the trader should know right now: performance, changes, edges, leaks, experiments, memory, and data health |
| Trades | Browse and filter visual trade case files |
| Explore | Ask deterministic questions such as “What makes me money?” |
| Review | Run daily/weekly/monthly evidence reviews |
| Memory | Browse challengeable evidence-backed statements |
| Experiments | Track hypotheses and observation windows |
| Import | Bring in historical CSV, Excel, or Notion data safely |
| Settings | Storage, privacy, provider, export, and migration controls |

## Target experience

The capture path remains explicit and post-trade. A trade case file shows identity, plan, actual result, evidence, reflection, calculated findings, unknowns, and optional AI explanation. The dashboard should prioritize one useful next investigation over a dense analytics wall.

