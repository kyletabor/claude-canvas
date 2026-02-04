# Beads Canvas Performance Review

**Reviewer:** quartz (polecat)
**Date:** 2026-02-05
**Issue:** cc-vkrw.6.2.2

## Summary

The Beads Canvas implementation is **generally well-optimized**. Core expensive operations like tree flattening are properly memoized, and handlers use useCallback appropriately. No critical performance issues were found. Several moderate and low-severity opportunities for optimization exist.

## Files Reviewed

- `src/canvases/beads/beads.tsx`
- `src/canvases/beads/components/bead-tree.tsx`
- `src/canvases/beads/components/bead-row.tsx`
- `src/canvases/beads/components/header-bar.tsx`
- `src/canvases/beads/components/status-bar.tsx`
- `src/canvases/beads/components/detail-panel.tsx`
- `src/canvases/beads/hooks/use-tree-navigation.ts`
- `src/canvases/beads/hooks/use-beads-ipc.ts`
- `src/canvases/beads/types.ts`
- `src/__tests__/*bead*.ts`

---

## Findings

### MODERATE Severity

#### 1. flattenTree creates new Set on each recursive call
**Location:** `bead-tree.tsx:57`
**Code:**
```typescript
const newVisited = new Set(visited);
newVisited.add(node.id);
```
**Issue:** Creates a copy of the visited Set for every node visited. For a tree with m nodes, this is O(m) per node, potentially O(m²) total.

**Impact:** Noticeable slowdown on very large trees (1000+ nodes). Acceptable for typical use cases (< 200 nodes).

**Recommendation:** Use add/delete pattern instead:
```typescript
visited.add(node.id);
// ... recurse ...
visited.delete(node.id);
```

---

#### 2. BeadRow component is not memoized
**Location:** `bead-row.tsx:38`
**Code:**
```typescript
export function BeadRow({ flat, isSelected, width }: BeadRowProps): React.JSX.Element {
```
**Issue:** BeadRow re-renders whenever BeadTree re-renders, even if its props haven't changed. With windowed rendering showing 20-50 rows, all visible rows re-render on every selection change.

**Impact:** Unnecessary virtual DOM diffing on navigation keystrokes.

**Recommendation:** Wrap with React.memo:
```typescript
export const BeadRow = React.memo(function BeadRow({ ... }: BeadRowProps) {
  // ...
});
```

---

#### 3. HeaderBar/StatusBar/DetailPanel not memoized
**Location:** `header-bar.tsx:21`, `status-bar.tsx:19`, `detail-panel.tsx:25`
**Issue:** These components re-render on every parent state change even when their props are unchanged.

**Impact:** Minor - these are simple components, but memoization would prevent unnecessary work.

**Recommendation:** Add React.memo to all leaf components.

---

### LOW Severity

#### 4. String creation in separators on every render
**Location:** `header-bar.tsx:26`, `status-bar.tsx:21`, `detail-panel.tsx:64,92,110`
**Code:**
```typescript
const separator = "━".repeat(width);
```
**Issue:** Creates a new string on every render. Called on resize events.

**Impact:** Minimal - string creation is fast. Only matters if resizing frequently.

**Recommendation:** Could memoize with useMemo if profiling shows it matters:
```typescript
const separator = useMemo(() => "━".repeat(width), [width]);
```

---

#### 5. Array spreads in flattenTree
**Location:** `bead-tree.tsx:72,78`
**Code:**
```typescript
parentPath: [...parentPath],
const childPath = [...parentPath, isLast];
```
**Issue:** Creates new arrays for each node. O(depth) per operation.

**Impact:** Minimal - depth is capped at 50 (MAX_DEPTH), so bounded.

**Recommendation:** Acceptable as-is due to depth limit.

---

#### 6. getTreePrefix creates array and joins
**Location:** `bead-tree.tsx:117-143`
**Issue:** For each visible row, creates an array and joins it. Called on every render for every visible row.

**Impact:** Minimal - small arrays, fast operation.

**Recommendation:** Could use string concatenation for micro-optimization, but not necessary.

---

#### 7. Double slice in BeadTree
**Location:** `bead-tree.tsx:182,202`
**Code:**
```typescript
const visibleNodes = nodes.slice(scrollOffset, scrollOffset + viewportHeight);
// later:
{visibleNodes.slice(0, contentHeight).map(...)}
```
**Issue:** Two slice operations when one could suffice.

**Impact:** Minimal - viewport is small.

**Recommendation:** Compute contentHeight first and slice once:
```typescript
const endIndex = Math.min(scrollOffset + contentHeight, nodes.length);
const visibleNodes = nodes.slice(scrollOffset, endIndex);
```

---

## Positive Findings (Well-Optimized Code)

### Tree flattening is properly memoized
**Location:** `beads.tsx:82-85`
```typescript
const flattenedNodes = useMemo(
  () => flattenTree(config?.nodes || [], expandedIds),
  [config?.nodes, expandedIds]
);
```
The most expensive operation (tree flattening) only runs when nodes or expanded state change.

---

### All handlers use useCallback
**Location:** `beads.tsx:93-125`
```typescript
const handleToggle = useCallback((beadId: string) => { ... }, []);
const handleDetails = useCallback((beadId: string) => { ... }, [ipc]);
const handleRefresh = useCallback(() => { ... }, [ipc]);
const handleEpicNav = useCallback((direction: 'prev' | 'next') => { ... }, [ipc]);
const handleQuit = useCallback(() => { ... }, [exit]);
```
Event handlers maintain stable references, preventing unnecessary child re-renders.

---

### IPC callback refs pattern correctly implemented
**Location:** `use-beads-ipc.ts:48-57`
```typescript
const onCloseRef = useRef(onClose);
// ...
useEffect(() => {
  onCloseRef.current = onClose;
  // ...
}, [onClose, onUpdate, onShowDetails]);
```
Avoids stale closure bugs while keeping the effect stable.

---

### Circular reference protection
**Location:** `bead-tree.tsx:51-54`
```typescript
if (visited.has(node.id)) {
  console.warn(`flattenTree: Circular reference detected for node '${node.id}', skipping`);
  continue;
}
```
Prevents infinite loops on malformed data.

---

### Depth limit prevents stack overflow
**Location:** `bead-tree.tsx:13,39-42`
```typescript
const MAX_DEPTH = 50;
// ...
if (depth > MAX_DEPTH) {
  console.warn(`flattenTree: Maximum depth (${MAX_DEPTH}) exceeded, truncating`);
  return [];
}
```
Protects against deeply nested or pathological trees.

---

### Windowed rendering
**Location:** `bead-tree.tsx:182`
```typescript
const visibleNodes = nodes.slice(scrollOffset, scrollOffset + viewportHeight);
```
Only renders visible rows, not the entire tree. Essential for performance with large datasets.

---

## Performance Checklist

| Check | Status | Notes |
|-------|--------|-------|
| Unnecessary re-renders | MODERATE | BeadRow and other components not memoized |
| Missing memoization | MODERATE | useMemo on flattenTree is good; components need React.memo |
| O(n²) or worse algorithms | LOW | Set copy in flattenTree; acceptable for typical sizes |
| Memory leaks | PASS | All effects have cleanup |
| Expensive render path ops | LOW | String creation in separators |
| Unbounded loops/recursion | PASS | MAX_DEPTH=50 protects against this |

---

## Recommendations Summary

**Priority 1 (Should Fix):**
1. Add React.memo to BeadRow component
2. Optimize flattenTree Set creation with add/delete pattern

**Priority 2 (Nice to Have):**
3. Add React.memo to HeaderBar, StatusBar, DetailPanel
4. Memoize separator strings in header/status/detail components
5. Combine double-slice into single slice in BeadTree

**No Action Required:**
- Tree flattening memoization is correct
- Handler memoization is correct
- IPC ref pattern is correct
- Circular reference and depth protections are appropriate
