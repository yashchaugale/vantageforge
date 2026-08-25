# VantageForge

## Overview

VantageForge is a local, TradingView-first post-trade journal for discretionary price-action traders. After a trade has finished, the trader captures its chart and Risk/Reward plan in one action, adds a minimal review, and later learns from visually grounded patterns in their own decisions. It is not a broker-connected portfolio tracker or trade-signal product.

## Goals

1. Capture a completed TradingView trade in under 10 seconds, excluding any optional reflection.
2. Preserve the visual chart context, planned levels, and trader explanation in one durable record.
3. Make a weekly review identify one evidence-backed behaviour or setup pattern without the user building reports.
4. Keep the personal product broker-independent and local to the user's computer.

## Core User Flow

1. The trader finishes a trade and leaves the relevant Risk/Reward drawing visible on TradingView.
2. The trader clicks **Capture Trade** (or later uses its keyboard shortcut).
3. VantageForge captures the current chart screenshot, symbol, timeframe, exchange, direction, entry, stop loss, and take profit.
4. The trader optionally adds outcome, exit price, a short note, and emotions in the review view.
5. The dashboard groups captured trades for visual review and calculates basic R-based metrics.
6. A future weekly review summarizes repeatable, evidence-backed patterns and one focused improvement.

## Features

### Post-Trade Capture

- Explicit manual capture; no entry is created from arbitrary chart drawings.
- Read chart context and the relevant TradingView Risk/Reward values.
- Save a screenshot with the trade record.
- Clearly explain capture failures.

### Trade Review

- Store result, exit price, notes, emotions, and planned versus actual R.
- Present chart evidence before dense analytics.
- Support later filtering by setup, market, timeframe, and behavioural tags.

### Insight Layer — Future

- Surface patterns only when supported by enough captured trade evidence.
- Give one actionable weekly experiment, not generic trade advice or predictions.

### Product experience

- Calm, chart-first dashboard with Today, Trades, Patterns, and Experiments navigation.
- Evidence-led review flow with local/private status and progressive visual hierarchy.

### Experiments

- A persisted experiment represents one behaviour, hypothesis, and observation window.
- Experiment progress is derived from reviewed trades and never presented as proof of causality.

### Database Foundation

- Keep the canonical trade model stable across the extension, SQLite database, and future hosted database.
- Store chart captures, reviews, tags, and AI-derived artifacts as separate, traceable records.
- Keep the personal edition independent of cloud quotas; a later public edition can migrate the same contract to hosted Postgres.

### Storage providers

- VantageForge Local keeps the existing SQLite and screenshot workflow.
- Notion is an opt-in persistent provider in the user's own workspace; VantageForge never promises unlimited storage.
- Provider selection changes the persistence adapter, not capture, review, analytics, patterns, experiments, or AI domain models.

## Scope

### In Scope

- Chrome extension for TradingView.
- Local trade capture and review.
- Single-user local storage in the first release.
- Risk/Reward-plan extraction, screenshots, lightweight metadata, and manual post-trade review.

### Out of Scope

- Broker, exchange, prop-firm, account, or P&L integrations.
- Automatic live-trade tracking, position monitoring, or order execution detection.
- Trading signals, investment advice, price predictions, or automated trading.
- Multi-user collaboration, mentor access, billing, and mobile apps in the personal release.
- Public hosted sync and multi-user access until the personal workflow is stable.

## Success Criteria

1. Creating or editing a Risk/Reward tool alone never creates a journal record.
2. A user can capture one completed TradingView trade with correct chart metadata, levels, and screenshot.
3. A captured trade can be reviewed and updated with result and exit price.
4. The dashboard accurately displays total trades, wins, losses, win rate, planned R, and actual R for available data.
