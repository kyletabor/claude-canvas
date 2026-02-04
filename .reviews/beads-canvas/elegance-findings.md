# Elegance Review: Beads Canvas

## Summary

The Beads Canvas implementation demonstrates strong design patterns with clean separation of concerns across types, components, and hooks. The FlattenedNode abstraction that converts hierarchical trees into flat lists for rendering while preserving tree metadata is particularly elegant. The component composition follows idiomatic React/Ink patterns, and the codebase is well-documented with JSDoc comments throughout.

However, there are incomplete abstractions (detail panel placeholder), potential extraction opportunities for shared utilities, and some inconsistencies in how state is managed between the main component and its children.

## Critical Issues

None identified.

## Major Issues

**M1. DetailPanel integration is incomplete** - `beads.tsx:171-182`

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

A full `DetailPanel` component exists in `components/detail-panel.tsx` with complete implementation (keyboard handling, status display, blockers section), but the main `BeadsCanvas` component renders an empty placeholder box instead of using it. The `detailBeadId` state is tracked but never used to look up the actual node.

**Impact:** Users who trigger detail mode (via 'o' key) see an empty bordered box, creating a confusing UX. The component exists but is disconnected from the orchestration layer.

**Suggested fix:** Wire up DetailPanel:
```typescript
{focusMode === 'detail' && detailBeadId && (
  <DetailPanel
    node={findNodeById(config?.nodes || [], detailBeadId)!}
    onClose={() => setFocusMode('tree')}
    width={Math.floor(dimensions.width * 0.5)}
    height={contentHeight}
  />
)}
```

## Minor Issues

**m1. `truncate` utility could be shared** - `bead-row.tsx:28-33`

```typescript
function truncate(text: string, maxLength: number): string {
  if (maxLength <= 0) return "";
  if (text.length <= maxLength) return text;
  if (maxLength <= 1) return "...";
  return text.slice(0, maxLength - 1) + "...";
}
```

This is a generic utility that likely has duplicates elsewhere (or will be needed). The Document canvas has similar text-handling needs.

**Suggested fix:** Extract to `canvas/src/utils/text.ts` or similar shared location.

---

**m2. Magic numbers in layout calculation** - `beads.tsx:88-90`

```typescript
const HEADER_HEIGHT = 2;
const FOOTER_HEIGHT = 2;
const contentHeight = dimensions.height - HEADER_HEIGHT - FOOTER_HEIGHT;
```

These constants are declared inline in the component. If HeaderBar or StatusBar rendering changes, these would need manual synchronization.

**Suggested fix:** Export height constants from the respective components or compute dynamically.

---

**m3. Emoji status icons have inconsistent terminal width** - `types.ts:69-75`

```typescript
export const STATUS_ICONS: Record<BeadStatus, string> = {
  pending: '📋',
  ready: '🟢',
  ...
};
```

Emojis render as 1-2 character widths depending on terminal, causing alignment issues in tree view. Some terminals treat them as 2 chars, others as 1.

**Suggested fix:** Consider offering a fallback ASCII mode or using consistent-width Unicode symbols (●, ○, ◐, ✓, ✕).

---

**m4. Inconsistent selection color application** - `bead-row.tsx:67-81`

```typescript
const textColor = isSelected ? BEAD_COLORS.selected : BEAD_COLORS.normal;
// ...
<Text inverse={isSelected}>
  {/* Tree prefix (dimmed) */}
  <Text color={BEAD_COLORS.dim}>{prefix}</Text>
  // ...
  <Text color={textColor}>{displayTitle}</Text>
```

When `inverse={isSelected}` is true, the nested color attributes interact oddly with Ink's rendering. The `textColor` variable is computed but then `inverse` is applied to the whole row, which may override the color intent.

**Suggested fix:** Either use inverse consistently without inner colors, or use background color explicitly for selection.

## Observations

**Clean Abstractions:**
- `FlattenedNode` type elegantly bridges tree structure to flat rendering while preserving depth/path metadata
- Hook separation (`useTreeNavigation`, `useBeadsIPC`) follows single-responsibility principle well
- The `parentPath: boolean[]` design for tracking ancestor "is-last" status is clever and enables correct tree-drawing

**Defensive Coding:**
- Circular reference detection with `visited` Set is thorough
- `MAX_DEPTH = 50` prevents stack overflow on malicious/corrupted data
- Null checks throughout (`node.blockedBy && node.blockedBy.length > 0`)

**Good Patterns:**
- `as const` for TREE_CHARS and BEAD_COLORS prevents accidental mutation
- Callback refs in IPC hook prevent effect re-runs
- Barrel exports in `hooks/index.ts` clean up imports

**Test Coverage:**
- Excellent coverage of `flattenTree` and `getTreePrefix` edge cases
- Circular reference test is valuable
- Missing: actual render tests for visual output verification

**Component Composition:**
- BeadsCanvas orchestrates HeaderBar, BeadTree, StatusBar cleanly
- BeadTree delegates row rendering to BeadRow appropriately
- Clear data flow: config -> flattenTree -> BeadRow[]

## Recommendations

1. **Priority: High** - Wire up the existing DetailPanel component to complete the feature
2. **Priority: Low** - Extract shared utilities as codebase grows
3. **Priority: Low** - Add render tests using Ink's testing utilities
