# Code Smells Review

## Summary

This PR introduces significant code duplication by adding simplified versions of components and types that already exist in a more mature form. The PR's `BeadTree.tsx` (71 lines) duplicates functionality from the existing `components/bead-tree.tsx` (219 lines), which already includes critical safety features like circular reference protection and depth limiting. Similarly, the PR's `types.ts` (27 lines) duplicates a subset of the existing `types.ts` (117 lines). Most critically, the PR's `index.ts` would break existing exports by replacing them with only the new simplified exports.

The pattern suggests this PR may contain earlier/prototype code that was already superseded by the current implementation. Merging this would introduce confusion, duplicate maintenance burden, and potentially break existing consumers.

## Critical Issues

**P0 - Must fix before merge**

- **Duplicate Component: `BeadTree.tsx` vs `components/bead-tree.tsx`**
  - File: `canvas/src/canvases/beads/BeadTree.tsx` (entire file)
  - The PR adds a 71-line `BeadTree.tsx` when a more complete 219-line `components/bead-tree.tsx` already exists
  - Existing version has: circular reference protection, MAX_DEPTH limit, scroll handling, selection support
  - PR version lacks all of these safety features and would be a regression
  - **Impact**: Technical debt, duplicate code, missing safety features
  - **Fix**: Remove `BeadTree.tsx` from PR or consolidate into existing component

- **Breaking Export Change: `index.ts`**
  - File: `canvas/src/canvases/beads/index.ts`
  - Current exports: `BeadsCanvas`, `BeadsCanvasProps`, all types
  - PR would replace with only: `BeadTree`, `BeadNode`, `BeadStatus`, `BeadTreeConfig`, `STATUS_ICONS`
  - **Impact**: Would break any code importing `BeadsCanvas` from this module
  - **Fix**: If new exports needed, add them to existing index.ts rather than replacing

- **Duplicate Types: `types.ts`**
  - File: `canvas/src/canvases/beads/types.ts` (PR version)
  - PR adds a subset of types that already exist in the current `types.ts`
  - PR version missing: `FlattenedNode`, `BeadsConfig`, `UNKNOWN_STATUS_ICON`, `TREE_CHARS`, `BEAD_COLORS`
  - PR uses `BeadTreeConfig` which differs from existing `BeadsConfig` (missing `epicIndex`, `totalEpics`)
  - **Impact**: Type confusion, inconsistent interfaces across codebase
  - **Fix**: Use existing types.ts; don't add duplicate type definitions

## Major Issues

**P1 - Should fix before merge**

- **Hardcoded Tree Characters in PR version**: `BeadTree.tsx:7-10`
  - PR defines: `TREE_LAST`, `TREE_MIDDLE`, `TREE_PIPE`, `TREE_SPACE` as local constants
  - Existing code has `TREE_CHARS` exported from types.ts with consistent naming
  - **Impact**: Inconsistent rendering between components, violates DRY
  - **Fix**: Import from shared types

- **Missing Circular Reference Protection**: `BeadTree.tsx:41-51`
  - `BeadNodeRow` recursively renders `node.children` without tracking visited nodes
  - Circular references would cause infinite recursion and stack overflow
  - Existing `flattenTree` has explicit `visited` Set for this
  - **Impact**: Runtime crash on malformed data
  - **Fix**: Add visited tracking or use existing flattenTree

- **Missing Depth Limit**: `BeadTree.tsx` (entire component)
  - No `MAX_DEPTH` check, deeply nested trees could cause performance issues or crashes
  - Existing implementation caps at 50 levels
  - **Impact**: Potential DoS on deeply nested data
  - **Fix**: Add depth limiting

## Minor Issues

**P2 - Nice to fix**

- **Minimal Test Coverage**: `__tests__/beads.test.ts`
  - PR adds only 27 lines of import tests
  - Existing test file has 451 lines with comprehensive unit tests
  - Tests don't verify actual tree rendering behavior, only that exports exist
  - **Fix**: Add actual behavior tests or integrate with existing test suite

- **Non-null Assertion in Recursion**: `BeadTree.tsx:48`
  - `node.children!.length` uses non-null assertion inside conditional that already checked `node.children`
  - While safe here, pattern is fragile
  - **Fix**: Use `node.children.length` since the conditional guarantees it exists

## Observations

**Non-blocking notes and suggestions**

- The PR appears to be adding prototype/early code that was already replaced by a more mature implementation
- Consider whether this PR should be closed rather than merged
- If the intent is to provide a "static" BeadTree variant without interactivity, this should be clearly documented and integrated with existing code rather than duplicating it
- The existing codebase shows good separation of concerns with `components/`, `hooks/`, and `types.ts` - any new functionality should follow this pattern
- Recommend reviewing git history to understand if these files were meant to be a starting point that evolved into the current implementation
