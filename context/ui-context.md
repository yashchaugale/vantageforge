# UI Context

## Theme

Dark, calm, and chart-first. VantageForge should feel like a focused trading workspace, not a colourful analytics casino. The popup is a small utility surface; the dashboard prioritises visual trade review and one clear next action.

## Colors

| Role | CSS Variable | Value |
| --- | --- | --- |
| Page background | `--bg-base` | `#0F1117` |
| Raised surface | `--bg-surface` | `#181B23` |
| Hover surface | `--bg-surface-hover` | `#20242D` |
| Primary text | `--text-primary` | `#F8FAFC` |
| Muted text | `--text-muted` | `#9CA3AF` |
| Primary accent | `--accent-primary` | `#60A5FA` |
| Accent hover | `--accent-primary-hover` | `#3B82F6` |
| Border | `--border-default` | `#292D36` |
| Error | `--state-error` | `#F87171` |
| Success | `--state-success` | `#4ADE80` |
| Warning | `--state-warning` | `#FBBF24` |

## Typography

| Role | Font | Variable |
| --- | --- | --- |
| UI text | System UI sans-serif | `--font-sans` |
| Values and R metrics | System UI monospace | `--font-mono` |

## Border Radius

| Context | Token |
| --- | --- |
| Inline controls | `--radius-sm: 6px` |
| Cards and panels | `--radius-md: 10px` |
| Modals | `--radius-lg: 14px` |

## Components

- Use native HTML controls and project CSS; no component library is installed.
- New UI must expose keyboard focus and use semantic buttons, labels, and dialog behaviour.
- Result states must use text and colour; colour alone is insufficient.

## Layout Patterns

- Popup: brand, short product statement, one primary **Capture Trade** action, then a secondary Dashboard action.
- Dashboard: summary at top, visual review as the dominant content, filters secondary.
- Trade review: screenshot first, planned levels and outcome second, optional notes/reflection third.
- Empty state: explain the post-trade capture workflow in one sentence and point to the primary action.
