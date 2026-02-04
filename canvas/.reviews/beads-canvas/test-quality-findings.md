# Test Quality Review: Beads Canvas

**Reviewer**: claude_canvas/polecats/quartz
**Date**: 2026-02-05
**Files Reviewed**:
- `src/__tests__/bead-row.test.ts`
- `src/__tests__/bead-tree.test.ts`
- `src/__tests__/beads.test.ts`
- `src/__tests__/beads-navigation.test.ts`

## Executive Summary

The test suite has significant structural issues. While it achieves code coverage through imports, many tests use weak assertions that verify "doesn't throw" rather than actual behavior. The `flattenTree` and `getTreePrefix` utilities have good tests, but component tests and the navigation hook are undertested.

**Overall Quality Score**: 4/10

---

## Finding 1: Weak "Doesn't Throw" Assertions

**Severity**: HIGH
**Files**: `bead-row.test.ts`, `bead-tree.test.ts` (component section)

### Problem

16 out of 16 tests in `bead-row.test.ts` use only `expect().not.toThrow()` assertions:

```typescript
// bead-row.test.ts:42-54
it("should handle title truncation at narrow widths", async () => {
  const { BeadRow } = await import("../canvases/beads/components/bead-row");
  expect(() => {
    BeadRow({ flat: makeFlatNode(), isSelected: false, width: 10 });
  }).not.toThrow();
  // ... more .not.toThrow() calls
});
```

The test claims to verify "title truncation at narrow widths" but never actually verifies that truncation occurs or works correctly.

### Impact

- Tests pass even if truncation is broken
- Tests pass even if wrong icons are displayed
- Tests pass even if selection styling is wrong
- False confidence in code correctness

### What Good Looks Like

```typescript
it("should truncate title at narrow widths", async () => {
  const { BeadRow } = await import("../canvases/beads/components/bead-row");
  const longTitle = "This is a very long title that should be truncated";
  const result = BeadRow({
    flat: makeFlatNode({ title: longTitle }),
    isSelected: false,
    width: 20
  });
  // Verify truncation actually happened
  expect(result.props.children).toContain("...");
  expect(result.props.children.length).toBeLessThan(longTitle.length);
});
```

---

## Finding 2: Meaningless Type Export Tests

**Severity**: MEDIUM
**Files**: `beads-navigation.test.ts:49-58`

### Problem

```typescript
test("exports UseTreeNavigationOptions type", async () => {
  const hooks = await import("../canvases/beads/hooks/use-tree-navigation");
  // TypeScript types are not available at runtime, but the module should load
  expect(hooks).toBeDefined();
});

test("exports UseTreeNavigationResult type", async () => {
  const hooks = await import("../canvases/beads/hooks/use-tree-navigation");
  expect(hooks).toBeDefined();
});
```

Both tests do the exact same thing: import a module and check it's defined. TypeScript types don't exist at runtime. These tests provide no value.

### Impact

- 2 tests that can never detect a real bug
- Misleading test names suggest type checking that doesn't happen
- Inflated test count without coverage

### Recommendation

Delete these tests. If type correctness matters, use TypeScript's compiler, not runtime tests.

---

## Finding 3: Duplicated Test Coverage

**Severity**: MEDIUM
**Files**: `bead-tree.test.ts`, `beads.test.ts`

### Problem

`flattenTree` is tested comprehensively in both files:

**bead-tree.test.ts**:
- `returns empty array for empty input`
- `flattens a single node without children`
- `flattens multiple root nodes`
- `includes children when expanded`
- `handles circular references without infinite loop`
- ...9 more tests

**beads.test.ts**:
- `returns empty array for empty input` (duplicate)
- `flattens single node` (duplicate)
- `flattens nested nodes when expanded` (duplicate)
- `handles circular references without infinite loop` (duplicate)
- ...8 more tests

### Impact

- Test suite takes longer to run
- Maintenance burden when function signature changes
- Unclear which tests are authoritative

### Recommendation

Consolidate `flattenTree` tests into one file. Keep the more comprehensive versions.

---

## Finding 4: Missing Behavioral Tests for useTreeNavigation

**Severity**: HIGH
**Files**: `beads-navigation.test.ts`

### Problem

The entire hook test suite (67 lines) contains only import verification:

```typescript
test("imports useTreeNavigation without throwing", async () => {
  const { useTreeNavigation } = await import(
    "../canvases/beads/hooks/use-tree-navigation"
  );
  expect(useTreeNavigation).toBeDefined();
  expect(typeof useTreeNavigation).toBe("function");
});
```

No tests for:
- Navigation up/down behavior
- Expand/collapse toggle
- Boundary conditions (first node, last node)
- Scroll offset calculation
- Selection state management

### Impact

- Hook logic entirely untested
- Regressions in navigation won't be caught
- Critical user-facing functionality at risk

### Recommended Tests

```typescript
describe("useTreeNavigation behavior", () => {
  it("moves selection down on moveDown()");
  it("moves selection up on moveUp()");
  it("does not move past first node");
  it("does not move past last node");
  it("toggles expand state on toggle()");
  it("adjusts scrollOffset when selection moves out of viewport");
});
```

---

## Finding 5: Tests That Verify Static Constants

**Severity**: LOW
**Files**: `beads.test.ts:64-95`, `beads-navigation.test.ts:9-37`

### Problem

Multiple tests verify that static constants have specific values:

```typescript
it('imports STATUS_ICONS from types', () => {
  expect(STATUS_ICONS).toBeDefined();
  expect(STATUS_ICONS.pending).toBe('📋');
  expect(STATUS_ICONS.ready).toBe('🟢');
  // ...
});

it('imports BEAD_COLORS from types', () => {
  expect(BEAD_COLORS.selected).toBe('cyan');
  expect(BEAD_COLORS.header).toBe('magenta');
  // ...
});
```

These test implementation details (specific emoji/color choices) rather than behavior.

### Impact

- Tests break when visual design changes, even if functionality is correct
- Tests don't verify that the constants are actually *used* correctly
- Encourages cargo-cult testing patterns

### Recommendation

- Delete these tests if constants are just configuration
- OR keep one test that verifies the constants exist (not specific values)
- Better: test that components actually render with correct styling

---

## Finding 6: Missing Error Path Tests

**Severity**: MEDIUM
**Files**: All test files

### Problem

No tests verify error handling for:
- Invalid status values in BeadRow
- Malformed node data in flattenTree
- Invalid indices in BeadTree
- Network/data loading errors

### Example Gap

```typescript
// What happens if status is undefined?
const node = { id: "test", title: "Test" }; // missing status
BeadRow({ flat: { node, ... }, isSelected: false, width: 80 });
// Should this throw? Render a fallback? The tests don't tell us.
```

### Recommendation

Add explicit error handling tests:

```typescript
it("renders fallback icon for undefined status", () => {
  const result = BeadRow({
    flat: makeFlatNode({ status: undefined as any }),
    ...
  });
  expect(result).toContain(UNKNOWN_STATUS_ICON);
});

it("throws descriptive error for missing required fields", () => {
  expect(() => BeadRow({ flat: null as any, ... }))
    .toThrow("flat is required");
});
```

---

## Finding 7: Tests That Can't Fail

**Severity**: HIGH
**Files**: `bead-row.test.ts`, `beads-navigation.test.ts`

### Problem

Tests that only verify a module loads or function is defined can only fail if:
- The import path is wrong
- The file has a syntax error
- The file has a missing dependency

These are development-time errors caught by the build, not runtime bugs.

### Count

- `bead-row.test.ts`: 16 tests that can't detect behavioral bugs
- `beads-navigation.test.ts`: 4 tests that can't detect behavioral bugs

### Impact

- 20 tests provide false confidence
- ~21% of test count has minimal value
- CI passes but code can be broken

---

## Summary Table

| Finding | Severity | Files | Fix Effort |
|---------|----------|-------|------------|
| Weak "doesn't throw" assertions | HIGH | bead-row.test.ts | Medium |
| Meaningless type export tests | MEDIUM | beads-navigation.test.ts | Low |
| Duplicated test coverage | MEDIUM | bead-tree.test.ts, beads.test.ts | Low |
| Missing useTreeNavigation tests | HIGH | beads-navigation.test.ts | High |
| Static constant verification | LOW | beads.test.ts, beads-navigation.test.ts | Low |
| Missing error path tests | MEDIUM | All files | Medium |
| Tests that can't fail | HIGH | Multiple files | Medium |

---

## Strengths

The test suite does have positive aspects:

1. **flattenTree tests are comprehensive** - Tests in `bead-tree.test.ts` for `flattenTree` verify actual output values, edge cases, and tree structure.

2. **getTreePrefix tests verify actual strings** - Tests check that tree characters appear in the right places.

3. **Circular reference handling** - Good test for a real edge case that could cause infinite loops.

4. **Integration test** - `beads.test.ts:407-469` tests a full workflow with realistic data.

5. **Helper functions** - Well-designed `makeNode` and `makeFlatNode` helpers reduce test boilerplate.

---

## Recommendations

### Priority 1: Add behavioral tests for BeadRow
Replace "doesn't throw" tests with assertions about actual rendered output.

### Priority 2: Add useTreeNavigation behavior tests
This is a critical gap. Navigation is user-facing functionality.

### Priority 3: Consolidate duplicate tests
Pick one file for `flattenTree` tests and delete duplicates.

### Priority 4: Delete meaningless tests
Remove type export tests and static constant value tests.

### Priority 5: Add error path coverage
Document expected error behavior and test it.
