# Correctness Review

## Summary

The BeadTree component implements a recursive tree renderer for displaying bead nodes with status icons and tree indentation. The code is generally well-structured but has **two potential runtime issues**: circular reference handling that could cause infinite recursion, and a status/blockedBy inconsistency where the blocked indicator is shown regardless of the node's actual status. The test coverage is minimal - only testing imports rather than actual rendering behavior.

## Critical Issues

(P0 - Must fix before merge)

*None identified*

## Major Issues

(P1 - Should fix before merge)

### 1. Circular Reference Causes Infinite Recursion
**File:** `canvas/src/canvases/beads/BeadTree.tsx:42-50`

The recursive `BeadNodeRow` component has no protection against circular references in the tree structure. If a node's `children` array contains a reference to an ancestor node (directly or indirectly), this will cause infinite recursion and a stack overflow crash.

```tsx
{node.children.map((child, index) => (
  <BeadNodeRow
    key={child.id}
    node={child}
    // No depth limit or visited tracking
  />
))}
```

**Impact:** Application crash if malformed data is passed.

**Suggested fix:** Either:
1. Add a `maxDepth` parameter with a reasonable limit (e.g., 20), or
2. Track visited node IDs in a Set passed through props

### 2. Insufficient Test Coverage for Core Functionality
**File:** `canvas/src/__tests__/beads.test.ts`

Tests only verify imports and STATUS_ICONS values. Missing tests for:
- Rendering nodes (actual component behavior)
- Empty nodes array
- Nested children with proper tree characters
- blockedBy indicator display
- Edge cases like single node, deeply nested trees

**Impact:** No confidence that the component renders correctly. Regressions won't be caught.

**Suggested fix:** Add render tests using `@testing-library/react` or `ink-testing-library`:
```tsx
test("renders tree with nested children", () => {
  const nodes = [{
    id: "root", title: "Root", status: "ready", priority: 1,
    children: [{ id: "child", title: "Child", status: "pending", priority: 2 }]
  }];
  const { lastFrame } = render(<BeadTree nodes={nodes} />);
  expect(lastFrame()).toContain("└──");
});
```

## Minor Issues

(P2 - Nice to fix)

### 1. Status/BlockedBy Inconsistency
**File:** `canvas/src/canvases/beads/BeadTree.tsx:32-34`

A node can have `blockedBy` populated but `status !== 'blocked'`. The component shows the blocker indicator `[→blockerId]` based solely on `blockedBy` presence, regardless of status.

```tsx
const blockerText = node.blockedBy && node.blockedBy.length > 0
  ? ` [→${node.blockedBy[0]}]`
  : '';
```

**Impact:** Confusing display if a node shows as "ready" (🟢) but also shows a blocker indicator.

**Suggested fix:** Either:
1. Only show blocker when `status === 'blocked'`, or
2. Document that blockedBy is informational and independent of status

### 2. Duplicate Node IDs Would Cause React Key Warnings
**File:** `canvas/src/canvases/beads/BeadTree.tsx:44,57`

Uses `node.id` as React key. If the data contains duplicate IDs (which violates expected invariants but could happen with malformed data), React will warn about duplicate keys and may have reconciliation issues.

**Impact:** Console warnings, potential rendering glitches with duplicate IDs.

**Suggested fix:** Consider validating ID uniqueness or using a composite key like `${parentId}-${node.id}-${index}`.

### 3. Only First Blocker Shown
**File:** `canvas/src/canvases/beads/BeadTree.tsx:33`

When a node has multiple blockers, only the first is displayed: `[→${node.blockedBy[0]}]`

**Impact:** Users may not see all blocking dependencies.

**Suggested fix:** Either show count `[→id1 +2 more]` or all blockers `[→id1, id2]`.

## Observations

(Non-blocking notes and suggestions)

1. **BeadTreeConfig type unused**: `types.ts:22-25` exports `BeadTreeConfig` but it's not used by `BeadTree` component which takes `BeadTreeProps` instead. Consider removing or using it.

2. **Good defensive coding**: The `node.children && node.children.length > 0` check before mapping is correct.

3. **Non-null assertion is safe**: The `node.children!.length - 1` on line 47 is guarded by the length check on line 42.

4. **No runtime type validation**: The component trusts that `node.status` is a valid `BeadStatus`. An invalid status would render `undefined` as the icon. For a component receiving external data, consider a fallback icon.
