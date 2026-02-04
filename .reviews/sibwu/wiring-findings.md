# Wiring Review

## Summary

PR #10 adds the initial `BeadTree` component with types and barrel exports, but **does not wire the component into the canvas system**. All declared dependencies (react, ink) are properly used, and no unused package.json additions were found. However, the component exists in isolation - it exports cleanly but cannot be rendered via the CLI or canvas API until subsequent integration work is completed.

This is a common pattern where foundational components are built first, then integrated in follow-up PRs. The wiring gap is not a bug per se, but should be noted for completeness.

## Critical Issues

(P0 - Must fix before merge)

*None identified.* All dependency wiring is correct.

## Major Issues

(P1 - Should fix before merge)

*None identified.* This PR is a foundational component that will be wired in subsequent work.

## Minor Issues

(P2 - Nice to fix)

### 1. `BeadTreeConfig` type exported but never used

**File:** `canvas/src/canvases/beads/types.ts:22-27` and `canvas/src/canvases/beads/index.ts:3`

The `BeadTreeConfig` interface is defined and exported but never actually consumed anywhere in PR #10:

```typescript
// types.ts (PR #10 version)
export interface BeadTreeConfig {
  nodes: BeadNode[];
  title?: string;
}
```

```typescript
// index.ts (PR #10 version)
export type { BeadNode, BeadStatus, BeadTreeConfig } from './types';
```

The test file imports but doesn't use `BeadTreeConfig`. While pre-exporting types for future consumers is acceptable, this specific type was later replaced by `BeadsConfig` in subsequent commits, suggesting it may have been premature.

**Impact:** Low - unused export adds minor noise but no functional impact.

**Suggestion:** Could have been added when actually needed, or the interface could have been consumed in a test case to validate the shape.

## Observations

(Non-blocking notes and suggestions)

### 1. Component registration deferred to follow-up PR

The `BeadTree` component is not registered in `canvas/src/canvases/index.tsx`. This means the component cannot be rendered via the `renderCanvas()` function or CLI. This was intentionally addressed in commit `3fafa20` ("Register BeadsCanvas in canvas system").

**This is acceptable** for an incremental development approach where:
1. PR #10 adds the foundational component
2. Subsequent PRs add orchestration, IPC, and registration

### 2. Tests verify imports only, not rendering

The test file (`beads.test.ts`) only validates that imports succeed and types exist:

```typescript
test("imports BeadTree component without throwing", async () => {
  const { BeadTree } = await import("../canvases/beads");
  expect(BeadTree).toBeDefined();
});
```

No actual rendering tests. This is reasonable for PR #10 scope but leaves a gap until integration tests are added.

### 3. No scenario registration

PR #10 doesn't add any scenario definitions for the beads canvas. Scenarios would typically be registered for use with the canvas CLI's `--scenario` flag. This was addressed in later integration work.

## Questions Answered

| Question | Answer |
|----------|--------|
| Is every new dependency actually used? | **Yes.** Both `react` and `ink` (Box, Text) are imported and used in `BeadTree.tsx`. No new entries were added to package.json in PR #10. |
| Are there old patterns that should have been replaced? | **No.** This is new code, no legacy patterns being superseded. |
| Is there dead config that suggests incomplete migration? | **No.** No config files or env vars were added. |

## Verdict

**APPROVE** - No wiring issues that would block merge. The deferred integration pattern is intentional and was completed in subsequent PRs.
