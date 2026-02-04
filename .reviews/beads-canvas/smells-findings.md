# Code Smells Review: Beads Canvas

**Reviewer**: claude_canvas/polecats/garnet
**Date**: 2026-02-05
**Scope**: `canvas/src/canvases/beads/**/*.ts*`, `canvas/src/__tests__/*bead*`

## Summary

The Beads Canvas implementation is generally clean with good component decomposition. A few minor code smells were identified, primarily around test helper duplication and some borderline-length functions.

**Overall Assessment**: Minor issues only - codebase is well-structured.

---

## Findings by Category

### 1. Long Methods (>50 lines)

| Severity | Location | Lines | Notes |
|----------|----------|-------|-------|
| Minor | `bead-tree.tsx:flattenTree` | ~70 | Borderline - handles edge cases (circular refs, depth limit). Could extract visited-set logic but current form is readable. |
| Minor | `use-tree-navigation.ts:useTreeNavigation` | ~120 | Hook includes setup + input handling. Structure is logical with clear sections. |
| Minor | `use-beads-ipc.ts:useBeadsIPC` | ~110 | Connection setup + message handlers. Well-organized with useEffect grouping. |

**Verdict**: Functions are at the upper edge but remain readable. No immediate refactoring needed.

---

### 2. Deep Nesting (>3 levels)

| Severity | Location | Depth | Notes |
|----------|----------|-------|-------|
| None | - | - | No excessive nesting found. Maximum observed is 3-4 levels in `flattenTree` recursion, which is appropriate for tree traversal. |

**Verdict**: Nesting is well-controlled throughout.

---

### 3. Copy-Paste Code (DRY Violations)

| Severity | Location | Issue |
|----------|----------|-------|
| **Medium** | Test files | `makeNode` helper duplicated in 4 test files with slight variations |
| **Medium** | Test files | `makeFlatNode` helper duplicated in 4 test files with slight variations |
| Minor | `header-bar.tsx:26`, `status-bar.tsx:21` | Separator pattern `"━".repeat(width)` duplicated |
| Minor | `detail-panel.tsx:64,92,110` | Divider pattern `"─".repeat(Math.max(0, width - 4))` appears 3 times |

**Locations of test helper duplication**:
- `beads.test.ts:12-30` - both helpers
- `bead-row.test.ts:4-24` - both helpers
- `bead-tree.test.ts:6-12` - makeNode only
- `beads-navigation.test.ts:9-30` (via imports) - uses types directly

**Recommendation**: Extract shared test helpers to a `__tests__/test-utils.ts` file.

---

### 4. God Classes/Functions

| Severity | Location | Notes |
|----------|----------|-------|
| None | - | Components are well-decomposed. Single responsibility is maintained throughout. |

**Verdict**: Good architectural decomposition.

---

### 5. Feature Envy

| Severity | Location | Notes |
|----------|----------|-------|
| None | - | `BeadRow` accesses `flat.node.*` extensively, but this is appropriate for a render component receiving data to display. |

**Verdict**: No problematic feature envy detected.

---

### 6. Primitive Obsession

| Severity | Location | Notes |
|----------|----------|-------|
| Minor | `types.ts:61` | `parentPath: boolean[]` could be a branded type for clarity, but current usage is clear. |

**Verdict**: Types are well-defined. Status uses discriminated union which is idiomatic.

---

### 7. Speculative Generality

| Severity | Location | Issue |
|----------|----------|-------|
| Minor | `use-beads-ipc.ts:138-140` | `sendError` method defined but never called anywhere in the codebase |
| Minor | `beads.tsx:171-181` | Detail panel box rendered in detail mode but comment indicates "future implementation" |

**Verdict**: Minor unused code. `sendError` could be removed if not planned for use.

---

### 8. TODO/FIXME Accumulation

| Severity | Location | Content |
|----------|----------|---------|
| Info | `beads.tsx:180` | `/* DetailPanel will be implemented in a future leg */` |

**Verdict**: Single planned-work comment, not debt accumulation.

---

## Metrics

| Metric | Implementation | Tests |
|--------|---------------|-------|
| Files reviewed | 11 | 4 |
| Total lines | ~1,169 | ~1,077 |
| Methods >50 lines | 3 (borderline) | 0 |
| Deep nesting (>3) | 0 | 0 |
| DRY violations | 4 | 2 (significant) |
| Dead code instances | 1 | 0 |

---

## Recommendations

### High Priority
1. **Extract test helpers**: Create `canvas/src/__tests__/beads-test-utils.ts` with shared `makeNode` and `makeFlatNode` helpers. This reduces ~80 lines of duplication.

### Low Priority
2. **Remove or document `sendError`**: Either use it or remove it. If kept for future use, add a comment.
3. **Extract separator/divider helpers**: Consider a `ui-chars.ts` utility for repeated character patterns if they spread further.

---

## Conclusion

The Beads Canvas codebase demonstrates good practices:
- Clear component boundaries
- Well-typed interfaces
- Defensive coding (circular ref protection, depth limits)
- Comprehensive test coverage

The main actionable item is consolidating test helpers to reduce duplication. The implementation code is clean and maintainable.
