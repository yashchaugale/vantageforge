# VantageForge Architecture

## Overview

VantageForge is a local-first AI trading journal.

The system is built around a simple pipeline:

Trading Session
        │
        ▼
Chrome Extension
        │
Capture Screenshot + Metadata
        │
        ▼
FastAPI Backend
        │
Store Data
        │
Run AI Analysis
        │
        ▼
SQLite Database
        │
Retrieve History
        │
        ▼
AI Coach
        │
Pattern Detection
        │
Recommendations
        │
        ▼
Dashboard