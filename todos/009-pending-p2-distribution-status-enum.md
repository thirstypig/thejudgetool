---
status: pending
priority: p2
issue_id: "009"
tags: [code-review, quality, schema]
dependencies: []
---

# distributionStatus should be a Prisma enum, not String?

## Problem Statement

`Competition.distributionStatus` is `String?` but only allows `null | "DRAFT" | "APPROVED"`. The rest of the schema uses enums for similar fields (CompetitionStatus, CategoryStatus, UserRole). This is inconsistent and allows invalid values.

Flagged by: TypeScript Reviewer, Architecture Strategist, Code Simplicity Reviewer.

## Proposed Solutions

### Option A: Add Prisma enum (Recommended)
- Create `enum DistributionStatus { DRAFT APPROVED }` in schema
- Change field to `distributionStatus DistributionStatus?`
- Run migration
- **Effort:** Small
- **Risk:** Low

## Acceptance Criteria

- [ ] distributionStatus uses Prisma enum
- [ ] Migration applied
- [ ] TypeScript types updated

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | |
