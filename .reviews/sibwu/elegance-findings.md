# Elegance Review

## Summary

The BeadTree component introduces a clean tree-rendering abstraction for displaying hierarchical bead structures. The code is well-organized with proper separation between types, components, and exports. The recursive `BeadNodeRow` pattern is idiomatic React and handles tree depth naturally.

However, there are design inconsistencies between defined types and actual usage, and the test coverage only validates imports rather than component behavior. The abstraction quality is solid, but a few details suggest incomplete follow-through on the design.

## Critical Issues

None identified.

## Major Issues

**M1. Unused `BeadTreeConfig` type creates confusion** - `types.ts:23-26`

```typescript
export interface BeadTreeConfig {
  nodes: BeadNode[];
  title?: string;
}
```

This type is exported but `BeadTree` component uses `BeadTreeProps` which only has `nodes`. The `title` field exists in config but has no effect. This creates confusion about intended API surface.

**Impact:** New developers may expect `title` to work but it won't. Two interfaces (`BeadTreeConfig` vs `BeadTreeProps`) for the same purpose is a code smell.

**Suggested fix:** Either remove `BeadTreeConfig` entirely and use `BeadTreeProps`, or update `BeadTree` to accept `BeadTreeConfig` and render the optional title.

---

**M2. Tests validate imports, not behavior** - `beads.test.ts:1-27`

All three tests use dynamic imports to verify modules load without throwing and that `STATUS_ICONS` has expected values. There are no tests that:
- Render `BeadTree` with actual nodes
- Verify tree structure renders correctly
- Test nested children
- Test blocker display

**Impact:** Zero confidence that the component renders correctly. Existing tests would pass even if rendering was broken.

**Suggested fix:** Add at least one test that renders `BeadTree` with sample data and verifies output structure.

## Minor Issues

**m1. Only first blocker displayed** - `BeadTree.tsx:30-32`

```typescript
const blockerText = node.blockedBy && node.blockedBy.length > 0
  ? ` [→${node.blockedBy[0]}]`
  : '';
```

When a node has multiple blockers, only the first is shown. This is a reasonable space-saving choice, but should be documented or show a count (e.g., `[→abc +2]`).

---

**m2. Inconsistent spacing in output** - `BeadTree.tsx:37`

```typescript
{prefix}{connector}{icon} {node.id}  {node.title}{blockerText}
```

Double space between `{node.id}` and `{node.title}` may be intentional for visual separation, but inconsistent with single space after icon. Consider using consistent spacing or explicit padding.

---

**m3. `priority` field lacks semantic guidance** - `types.ts:8`

```typescript
priority: number;
```

No documentation on the scale (P0-P3? 1-5?). Compare to `flight/types.ts` which documents fields with inline comments. Adding a comment like `// 0 = highest, 3 = lowest` would help.

## Observations

- **Tree drawing constants** (`TREE_LAST`, `TREE_MIDDLE`, etc.) are clean and self-documenting. Good choice.

- **Recursive component pattern** for `BeadNodeRow` is idiomatic React. Keeping it in the same file as `BeadTree` is appropriate since it's an internal implementation detail.

- **File organization** follows existing patterns (`flight/`, `document/`, `calendar/`). Good consistency with codebase.

- **No integration with canvas system** yet - this appears to be groundwork for a future beads canvas. The component is pure and doesn't depend on IPC or hooks, which is good for initial development.

- **Export pattern** in `index.ts` is clean and follows barrel export conventions used elsewhere in the codebase.
