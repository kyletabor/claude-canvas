# Style Review: Beads Canvas Implementation

**Reviewer:** Style Review Agent (cc-vkrw.6.2.6)
**Date:** 2026-02-05
**Files Reviewed:** 11 source files, 4 test files

---

## Summary

The Beads Canvas implementation demonstrates **strong overall style consistency** with the existing codebase. The code follows established patterns from the flight, document, and calendar canvases. A few minor inconsistencies and improvement opportunities are noted below.

**Overall Rating:** Good (minor issues only)

---

## 1. Naming Conventions

### Findings

**Consistent with codebase:**
- File naming follows kebab-case pattern (`bead-row.tsx`, `use-tree-navigation.ts`)
- Component names use PascalCase (`BeadTree`, `HeaderBar`, `DetailPanel`)
- Hook names follow `use` prefix convention (`useTreeNavigation`, `useBeadsIPC`)
- Type names use PascalCase (`BeadNode`, `FlattenedNode`, `BeadsConfig`)
- Constants use SCREAMING_SNAKE_CASE (`STATUS_ICONS`, `TREE_CHARS`, `BEAD_COLORS`)

**Minor Issues:**

| Location | Issue | Severity |
|----------|-------|----------|
| `types.ts:69` | `STATUS_ICONS` - consistent with `CYBER_COLORS` in flight/types.ts | N/A (correct) |
| `detail-panel.tsx:31` | Return type `JSX.Element` differs from other files using `React.JSX.Element` | Low |

### Recommendation

The `detail-panel.tsx` uses `JSX.Element` while other beads components use `React.JSX.Element`:
```typescript
// detail-panel.tsx:31
}: DetailPanelProps): JSX.Element {

// bead-row.tsx:38 (preferred pattern)
}: BeadRowProps): React.JSX.Element {
```

Consider aligning to `React.JSX.Element` for consistency within the beads module.

---

## 2. Formatting Consistency

### Findings

**Quote Style:**
The codebase shows mixed usage, which is acceptable:
- `bead-tree.tsx` uses single quotes for strings
- `bead-row.tsx` uses double quotes for strings
- `use-beads-ipc.ts` uses double quotes

This matches the broader pattern in the codebase (flight uses double quotes, some other files use single).

**Indentation:**
- All files use 2-space indentation consistently

**Trailing Commas:**
- Consistent trailing comma usage in arrays and object literals

**Line Length:**
- Most lines stay within reasonable bounds (~100 chars)

**No Issues Found** - formatting is consistent.

---

## 3. Import Organization

### Findings

**Pattern Used:**
```typescript
// 1. React imports
import React, { useState, useEffect, useMemo, useCallback } from 'react';
// 2. Third-party (ink)
import { Box, Text, useApp, useStdout } from 'ink';
// 3. Local types
import type { BeadsConfig } from './types';
// 4. Local components
import { HeaderBar } from './components/header-bar';
```

**Consistent with codebase:** Yes, follows the same pattern as other canvases.

**Minor Issues:**

| Location | Issue | Severity |
|----------|-------|----------|
| `use-beads-ipc.ts:6-10` | Type imports mixed with value imports on separate lines | Informational |

Example from `use-beads-ipc.ts`:
```typescript
import { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "ink";
import { connectWithRetry, type IPCClient } from "../../../ipc/client";
import type { CanvasMessage, ControllerMessage } from "../../../ipc/types";
import type { BeadsConfig } from "../types";
```

This is fine - the pattern of `import type` being used appropriately for type-only imports is correct and consistent with TypeScript best practices.

---

## 4. Comment Quality

### Findings

**Positive Observations:**

1. **JSDoc-style comments** on all exported functions and types:
   ```typescript
   /**
    * Flattens a hierarchical BeadNode tree into a list for rendering.
    * Handles circular references and depth limits for safety.
    *
    * @param nodes - Root nodes to flatten
    * @param expandedIds - Set of node IDs that are currently expanded
    * ...
    */
   ```

2. **Section comments** in test files using clear delimiters:
   ```typescript
   // ============================================================================
   // 1. Import Tests
   // ============================================================================
   ```

3. **Inline comments** explain non-obvious logic:
   ```typescript
   // prefix + icon (2 chars with space) + id + "  " + title + blockerText
   const prefixLen = prefix.length;
   ```

4. **Type documentation** with JSDoc `@example` tags:
   ```typescript
   /**
    * @example
    * // Root node with children (expanded)
    * getTreePrefix({ depth: 0, hasChildren: true, isExpanded: true, ... }) // "▼ "
    */
   ```

**Minor Issues:**

| Location | Issue | Severity |
|----------|-------|----------|
| `beads.tsx:180` | Comment "DetailPanel will be implemented in a future leg" is stale - DetailPanel exists | Low |
| `header-bar.tsx` | No JSDoc on `HeaderBar` component (unlike other components) | Informational |
| `status-bar.tsx` | No JSDoc on `StatusBar` component (unlike other components) | Informational |

### Recommendation

Remove or update the stale comment at `beads.tsx:180`:
```typescript
{/* Detail panel (future implementation) */}
{focusMode === 'detail' && (
  <Box ...>
    {/* DetailPanel will be implemented in a future leg */}  // <- stale
  </Box>
)}
```

---

## 5. Consistency with Rest of Codebase

### Findings

**Structure Comparison:**

| Aspect | Beads | Flight | Calendar |
|--------|-------|--------|----------|
| types.ts location | `beads/types.ts` | `flight/types.ts` | `calendar/types.ts` |
| Components folder | `beads/components/` | `flight/components/` | N/A (inline) |
| Hooks folder | `beads/hooks/` | N/A | `calendar/hooks/` |
| Index barrel | `beads/index.ts` | N/A | N/A |

**Pattern Alignment:**

1. **Color constants pattern** - Beads uses `BEAD_COLORS`, Flight uses `CYBER_COLORS`:
   - Both use `as const` assertion
   - Both export as named constant

2. **Props interface pattern** - Consistent:
   ```typescript
   // beads/components/bead-row.tsx
   export interface BeadRowProps { ... }

   // flight/components/flight-card.tsx (pattern matches)
   interface Props { ... }
   ```

3. **Canvas registration** - Properly added to `index.tsx` switch statement

**Minor Style Divergence:**

| Aspect | Beads Pattern | Flight Pattern | Severity |
|--------|---------------|----------------|----------|
| Props naming | `BeadRowProps`, `HeaderBarProps` | `Props` (inline) | Low |
| File header comments | JSDoc style | Simple `// Comment` | Low |

The beads module uses more descriptive interface names (`BeadRowProps`) while flight uses generic `Props`. Both are acceptable, but beads is more explicit which aids discoverability.

---

## 6. TypeScript Best Practices

### Findings

**Positive Observations:**

1. **Strict type usage:**
   ```typescript
   export type BeadStatus = 'pending' | 'ready' | 'in_progress' | 'completed' | 'blocked';
   ```

2. **`as const` assertions for immutable objects:**
   ```typescript
   export const TREE_CHARS = { ... } as const;
   export const BEAD_COLORS = { ... } as const;
   ```

3. **Proper `type` imports:**
   ```typescript
   import type { BeadNode, FlattenedNode } from '../types';
   ```

4. **Optional chaining and nullish coalescing:**
   ```typescript
   const children = node.children ?? [];
   const statusIcon = STATUS_ICONS[node.status] ?? UNKNOWN_STATUS_ICON;
   ```

5. **Ref typing:**
   ```typescript
   const clientRef = useRef<IPCClient | null>(null);
   ```

**Minor Issues:**

| Location | Issue | Severity |
|----------|-------|----------|
| `use-beads-ipc.ts:76` | Unchecked cast `msg.config as BeadsConfig` | Low |
| `detail-panel.tsx:96` | Non-null assertion `node.blockedBy!` after already checking truthy | Informational |

The cast at `use-beads-ipc.ts:76` could be safer:
```typescript
case "update":
  onUpdateRef.current?.(msg.config as BeadsConfig);  // Cast without validation
  break;
```

However, this pattern matches other canvases and the IPC protocol is trusted.

---

## 7. Test Style

### Findings

**Consistent Patterns:**

1. **Test file naming:** `*.test.ts` matches existing pattern
2. **Import style:** `import { describe, expect, it } from 'bun:test'`
3. **Helper functions:** Use `makeNode()` / `makeFlatNode()` helpers consistently
4. **Describe blocks:** Logical grouping of related tests

**Minor Issues:**

| Location | Issue | Severity |
|----------|-------|----------|
| `beads.test.ts:6` vs `bead-row.test.ts:1` | Different import ordering (test framework vs types first) | Informational |
| `beads-navigation.test.ts:1` | Uses `test` instead of `it` (mixed in codebase) | Informational |

The mixed use of `test()` and `it()` is acceptable as they are aliases in bun:test.

---

## Summary of Findings

### Must Fix (0)
None - no critical style violations.

### Should Fix (2)

1. **Stale comment removal** (`beads.tsx:180`)
   - The "future implementation" comment is outdated as DetailPanel exists

2. **Return type consistency** (`detail-panel.tsx:31`)
   - Change `JSX.Element` to `React.JSX.Element` for internal consistency

### Nice to Have (3)

1. Add JSDoc to `HeaderBar` and `StatusBar` components
2. Consider adding runtime validation for IPC messages if protocol changes
3. Align props interface naming convention (though current approach is valid)

---

## Files Reviewed

**Source Files:**
- `canvas/src/canvases/beads/beads.tsx`
- `canvas/src/canvases/beads/types.ts`
- `canvas/src/canvases/beads/index.ts`
- `canvas/src/canvases/beads/components/bead-row.tsx`
- `canvas/src/canvases/beads/components/bead-tree.tsx`
- `canvas/src/canvases/beads/components/detail-panel.tsx`
- `canvas/src/canvases/beads/components/header-bar.tsx`
- `canvas/src/canvases/beads/components/status-bar.tsx`
- `canvas/src/canvases/beads/hooks/index.ts`
- `canvas/src/canvases/beads/hooks/use-beads-ipc.ts`
- `canvas/src/canvases/beads/hooks/use-tree-navigation.ts`

**Test Files:**
- `canvas/src/__tests__/beads.test.ts`
- `canvas/src/__tests__/bead-row.test.ts`
- `canvas/src/__tests__/beads-navigation.test.ts`
- `canvas/src/__tests__/bead-tree.test.ts`
