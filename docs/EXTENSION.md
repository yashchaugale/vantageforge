# TradingView Extension

## Current

Manifest V3 popup and dashboard communicate through an isolated content script and MAIN-world page script. The user explicitly captures a completed RR drawing; the bridge reads chart metadata, candle context, levels, and screenshot. Local service persistence has browser-storage fallback.

## Known limitations

The bridge reads TradingView private models/DOM and can break when TradingView changes. Multiple RR drawings lack a polished selection flow. Browser end-to-end fixtures and cross-timezone regression coverage are missing.

## Future

Keep permissions narrow, isolate private-model code, show clear failures, support keyboard capture only after reliability, and maintain compatibility aliases during the You Can't Trade rebrand.

