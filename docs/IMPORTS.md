# Import Plan

## Current status

No verified CSV or Excel import workflow is implemented. Notion is a persistence provider, not yet a general-purpose historical import tool.

## Future requirements

Support CSV, Excel, and Notion imports with preview, column mapping, validation, duplicate detection, dry run, rollback, screenshot handling, timezone selection, and a report of rejected/unknown fields. Imported records must preserve provenance and never overwrite existing immutable IDs without explicit mapping.

