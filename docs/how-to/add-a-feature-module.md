# How to Add a Feature Module

Feature modules live in `src/features/<name>/` and follow a consistent structure. This guide walks through creating a new one.

## 1. Create the Directory Structure

```bash
mkdir -p src/features/my-feature/{components,hooks,store,actions,schemas,types,utils}
touch src/features/my-feature/index.ts
```

Each subdirectory has a purpose:

| Directory | Contains |
|-----------|----------|
| `components/` | React components (client or server) |
| `hooks/` | Custom React hooks |
| `store/` | Zustand stores |
| `actions/` | Server actions (`"use server"`) |
| `schemas/` | Zod validation schemas |
| `types/` | TypeScript types |
| `utils/` | Helper functions |

## 2. Write the Barrel Export

`index.ts` is the **only** public API. Other features import from here — never reach into subdirectories.

```typescript
// src/features/my-feature/index.ts
export { MyComponent } from "./components/MyComponent";
export { useMyHook } from "./hooks/useMyHook";
export type { MyType } from "./types";
```

## 3. Add Server Actions

Server actions go in `actions/index.ts` with `"use server"` at the top. Every action **must** start with an auth guard:

```typescript
"use server";

import { requireOrganizer } from "@shared/lib/auth-guards";
import { prisma } from "@shared/lib/prisma";

export async function myAction(data: MyInput) {
  await requireOrganizer(); // Auth guard FIRST

  // ... business logic
}
```

Available guards: `requireAuth()`, `requireOrganizer()`, `requireJudge()`, `requireCaptain()`.

## 4. Add Zod Schemas

Validation schemas go in `schemas/index.ts`. Use them in both forms (client) and server actions:

```typescript
import { z } from "zod";

export const mySchema = z.object({
  name: z.string().min(1, "Required"),
  count: z.number().int().positive(),
});

export type MyInput = z.infer<typeof mySchema>;
```

## 5. Add a Zustand Store (if needed)

Client state goes in `store/index.ts`:

```typescript
import { create } from "zustand";

interface MyStore {
  items: string[];
  addItem: (item: string) => void;
}

export const useMyStore = create<MyStore>((set) => ({
  items: [],
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
}));
```

## 6. Add Pages

Pages live in `src/app/`. Import from your feature's barrel:

```typescript
import { MyComponent } from "@features/my-feature";
```

Use path aliases: `@features/*` for features, `@shared/*` for shared code, `@/*` for anything in `src/`.

## 7. Add Tests

Put tests alongside source in `__tests__/` directories. Extract pure utility functions for easy testing:

```bash
mkdir src/features/my-feature/utils/__tests__
```

```typescript
// utils/__tests__/myUtil.test.ts
import { describe, it, expect } from "vitest";
import { myUtil } from "../myUtil";

describe("myUtil", () => {
  it("does the thing", () => {
    expect(myUtil("input")).toBe("output");
  });
});
```

Run with `npm test`.

## Checklist

- [ ] Directory structure created with all subdirectories
- [ ] `index.ts` barrel export only exposes what other features need
- [ ] Server actions have auth guards as first line
- [ ] Zod schemas validate all inputs
- [ ] Components use shared UI primitives from `@shared/components/ui/`
- [ ] No imports reaching into other features' subdirectories
- [ ] Tests cover utility functions and schemas
