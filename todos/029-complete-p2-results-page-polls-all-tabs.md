---
status: pending
priority: p2
issue_id: "029"
tags: [code-review, performance]
dependencies: []
---

# Results page polls all data regardless of active tab

## Problem Statement

The results page at `src/app/(dashboard)/organizer/[competitionId]/results/page.tsx` fires 4 parallel server action calls every 15 seconds (getCompetitionById, getCompetitionProgress, getAllCategoryResults, getAuditLog) regardless of which tab is active. This results in ~17+ DB queries per poll cycle even when the user only needs one tab's data.

Flagged by: Performance Oracle (OPT-1).

## Proposed Solutions

### Option A: Poll only active tab data (Recommended)

```typescript
const load = useCallback(async () => {
  const comp = await getCompetitionById(params.competitionId);
  setCompetition(comp);
  if (activeTab === "progress") setProgress(await getCompetitionProgress(...));
  else if (activeTab === "results") setResults(await getAllCategoryResults(...));
  else if (activeTab === "audit") setAuditLogs(await getAuditLog(...));
}, [params.competitionId, activeTab]);
```

- Pros: 60-75% reduction in polling load
- Cons: Stale data on tab switch until next poll (acceptable with 15s interval)
- Effort: Small
- Risk: Low

## Acceptance Criteria

- [ ] Only active tab's data is fetched during polling
- [ ] Tab switch triggers immediate data load for the new tab

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | — |
