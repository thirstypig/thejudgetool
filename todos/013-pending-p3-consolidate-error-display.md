---
status: pending
priority: p3
issue_id: "013"
tags: [code-review, quality]
dependencies: []
---

# BoxDistributionPanel has duplicate error display logic

## Problem Statement

Two error displays at lines 152 and 169 of `BoxDistributionPanel.tsx` — one inside the distribution view, one outside. They're mutually exclusive due to guards but could be consolidated to a single display.

Flagged by: Code Simplicity Reviewer.

## Proposed Solutions

Replace both with single `{error && <p className="mt-2 text-sm text-destructive">{error}</p>}` before closing `</SectionCard.Body>`.

## Acceptance Criteria

- [ ] Single error display in BoxDistributionPanel

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | |
