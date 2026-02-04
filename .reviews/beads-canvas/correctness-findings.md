# Beads Canvas Correctness Review

**Reviewer:** obsidian (polecat)
**Date:** 2026-02-05
**Files reviewed:**
- `canvas/src/canvases/beads/beads.tsx`
- `canvas/src/canvases/beads/types.ts`
- `canvas/src/canvases/beads/index.ts`
- `canvas/src/canvases/beads/components/bead-row.tsx`
- `canvas/src/canvases/beads/components/bead-tree.tsx`
- `canvas/src/canvases/beads/components/detail-panel.tsx`
- `canvas/src/canvases/beads/components/header-bar.tsx`
- `canvas/src/canvases/beads/components/status-bar.tsx`
- `canvas/src/canvases/beads/hooks/use-beads-ipc.ts`
- `canvas/src/canvases/beads/hooks/use-tree-navigation.ts`
- `canvas/src/__tests__/bead-*.test.ts`
- `canvas/src/__tests__/beads*.test.ts`

---

## Critical Issues

None identified. The core logic is sound.

---

## Major Issues

### 1. IPC message type casting without validation
**Location:** `use-beads-ipc.ts:76-77, 82`
**Severity:** Major

```typescript
case "update":
  onUpdateRef.current?.(msg.config as BeadsConfig);
  break;
case "showDetails":
  onShowDetailsRef.current?.(msg.beadId);
```

The `msg.config` is cast to `BeadsConfig` without runtime validation. If the controller sends malformed config data, this could cause runtime errors when components try to access expected properties.

Similarly, `msg.beadId` is accessed without type narrowing confirmation that the `showDetails` message type includes this property in `ControllerMessage`.

**Recommendation:** Add runtime validation or use a type guard before passing data to callbacks.

---

### 2. ContentHeight can become zero or negative
**Location:** `bead-tree.tsx:188-191`

```typescript
const contentHeight = viewportHeight - (hasTopIndicator ? 1 : 0) - (hasBottomIndicator ? 1 : 0);
```

If `viewportHeight` is 0, 1, or 2 with scroll indicators, `contentHeight` becomes 0 or negative. While `slice(0, negativeNumber)` returns empty array safely, passing negative `height` to Ink's `<Box height={contentHeight}>` may cause unexpected rendering behavior.

**Recommendation:** Clamp `contentHeight` to minimum of 0:
```typescript
const contentHeight = Math.max(0, viewportHeight - (hasTopIndicator ? 1 : 0) - (hasBottomIndicator ? 1 : 0));
```

---

### 3. DetailPanel component imported but not used
**Location:** `beads.tsx:172-181`

The detail panel area renders an empty `<Box>` when `focusMode === 'detail'`:

```typescript
{focusMode === 'detail' && (
  <Box
    flexDirection="column"
    width={Math.floor(dimensions.width * 0.5)}
    borderStyle="single"
    borderColor="gray"
    paddingX={1}
  >
    {/* DetailPanel will be implemented in a future leg */}
  </Box>
)}
```

The `DetailPanel` component exists in `components/detail-panel.tsx` but is not imported or used. Users pressing 'o' to open details will see an empty bordered panel.

**Recommendation:** Either import and use `DetailPanel` or remove the detail mode functionality until implementation is complete.

---

## Minor Issues

### 1. Emoji width assumption may cause alignment issues
**Location:** `bead-row.tsx:54`

```typescript
const iconLen = 2; // emoji + space
```

Emoji display width varies by terminal (1-2 columns). The hardcoded value of 2 may cause alignment issues on terminals that render emojis as single-width characters.

---

### 2. Only first blocker shown in BeadRow
**Location:** `bead-row.tsx:49`

```typescript
const blockerText = hasBlocker ? ` [→${node.blockedBy![0]}]` : "";
```

When a bead is blocked by multiple items, only the first blocker ID is displayed. Users won't see the complete blocking picture without opening details.

---

### 3. StatusBar help text shows non-functional shortcuts
**Location:** `status-bar.tsx:26`

```typescript
helpText = "←→ epics  ↑↓ navigate  ▸/▼ expand  o open  ? help  q quit";
```

Issues:
- `▸/▼` suggests these keys toggle expand, but only `Enter` is bound in `useTreeNavigation`
- `?` for help is shown but no handler exists for it

**Recommendation:** Either implement the missing shortcuts or update help text to reflect actual bindings (`Enter` for expand, remove `? help`).

---

### 4. Status formatting only replaces first underscore
**Location:** `detail-panel.tsx:73`

```typescript
{node.status.charAt(0).toUpperCase() + node.status.slice(1).replace("_", " ")}
```

`String.replace()` without `g` flag only replaces the first occurrence. While current statuses (`in_progress`) have only one underscore, this pattern is fragile for future status values.

**Recommendation:** Use `replaceAll` or global regex: `.replace(/_/g, " ")`

---

### 5. Priority field not displayed
**Location:** `bead-row.tsx`

The `BeadNode` type includes a `priority` field, but `BeadRow` doesn't render it. Users cannot see task priority without opening the detail panel.

---

## Observations

### Positive Findings

1. **Excellent circular reference protection** - `flattenTree` uses a `visited` Set to detect and skip circular references with appropriate warnings (lines 51-58).

2. **Good depth limiting** - MAX_DEPTH of 50 prevents stack overflow on pathologically deep trees (lines 39-42).

3. **Defensive null checks** - Code handles edge cases well:
   - Empty/undefined nodes array in `flattenTree` (line 34)
   - Null nodes in iteration (`if (!node) continue` at line 48)
   - Optional `blockedBy` with null-coalescing

4. **Clean callback ref pattern** - `useBeadsIPC` uses refs for callbacks to avoid effect re-runs while maintaining fresh callback access (lines 48-57).

5. **Proper cleanup on unmount** - The `mounted` flag pattern in `useBeadsIPC` correctly handles async connection completion after unmount (lines 63, 96-103).

6. **Comprehensive test coverage** - Tests cover:
   - Empty inputs
   - Circular references
   - Deep nesting
   - All valid statuses
   - Edge cases (narrow width, long titles, undefined blockedBy)

### Architecture Notes

- Clean separation of concerns: types, components, and hooks are well-organized
- Good use of TypeScript generics and const assertions for type safety
- Appropriate use of `useMemo` and `useCallback` for performance optimization
