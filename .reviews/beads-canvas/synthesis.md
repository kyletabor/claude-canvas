# Beads Canvas PR Review Synthesis

**Synthesizer:** obsidian (polecat)
**Date:** 2026-02-06
**PR:** Beads Canvas Implementation

---

## 1. Executive Summary

**Overall Assessment:** APPROVE WITH CHANGES

The Beads Canvas implementation is well-architected with clean separation of concerns, comprehensive defensive coding patterns (circular reference protection, depth limiting), and proper React/Ink patterns. The core functionality is sound and follows existing codebase conventions.

**Key Strengths:**
- Excellent tree traversal safety (circular reference detection, MAX_DEPTH=50)
- Clean hook separation (`useTreeNavigation`, `useBeadsIPC`)
- Proper memoization of expensive operations (`flattenTree`)
- Windowed rendering for performance
- Good TypeScript usage with `as const` and proper type imports

**Key Weaknesses:**
- DetailPanel component exists but is not wired up (empty panel on 'o' key)
- Test suite has significant gaps (many "doesn't throw" assertions without behavioral verification)
- IPC messages lack runtime schema validation
- Several components not memoized with `React.memo`

**Merge Recommendation:** Approve after addressing P0 issues. P1 issues should be tracked for follow-up.

---

## 2. Critical Issues (P0)

### P0-1: DetailPanel Component Not Wired
**Found by:** Correctness, Elegance, Wiring
**Location:** `beads.tsx:171-182`, `components/detail-panel.tsx`

A complete 118-line `DetailPanel` component exists with full functionality (keyboard handling, status display, blockers section), but `BeadsCanvas` renders an empty placeholder:

```typescript
{focusMode === 'detail' && (
  <Box ...>
    {/* DetailPanel will be implemented in a future leg */}
  </Box>
)}
```

**Impact:** Users pressing 'o' see an empty bordered panel. The `detailBeadId` state is tracked but never read.

**Fix:** Wire up the existing component:
```typescript
import { DetailPanel } from './components/detail-panel';
// ...
{focusMode === 'detail' && detailBeadId && (
  <DetailPanel
    node={findNodeById(config?.nodes || [], detailBeadId)}
    onClose={() => setFocusMode('tree')}
    width={Math.floor(dimensions.width * 0.5)}
    height={contentHeight}
  />
)}
```

---

## 3. Major Issues (P1)

### P1-1: IPC Message Validation Missing
**Found by:** Security, Correctness, Resilience
**Location:** `use-beads-ipc.ts:76`, `ipc/client.ts:45`

IPC messages are cast directly to expected types without runtime validation:
```typescript
case "update":
  onUpdateRef.current?.(msg.config as BeadsConfig);
```

**Risk:** Malformed messages could inject unexpected data or cause runtime errors.

**Fix:** Add Zod or io-ts schema validation before type casting.

---

### P1-2: Path Traversal in Socket Path Construction
**Found by:** Security
**Location:** `ipc/types.ts:50-52`

```typescript
export function getSocketPath(id: string): string {
  return `/tmp/canvas-${id}.sock`;
}
```

**Risk:** Unsanitized `id` enables path traversal: `getSocketPath("../../etc/passwd")`

**Fix:** Validate `id` contains only alphanumeric/hyphen/underscore, or use `path.basename()`.

---

### P1-3: IPC Connection Failures Silent
**Found by:** Resilience
**Location:** `use-beads-ipc.ts:104-106`

Connection failures are logged but not surfaced to UI state:
```typescript
} catch (err) {
  console.error("Failed to connect to controller:", err);
}
```

**Impact:** Canvas appears functional but IPC silently fails.

**Fix:** Set an error state and display in UI.

---

### P1-4: Test Suite Has Weak Assertions
**Found by:** Test Quality (both legs)
**Location:** `bead-row.test.ts`, `beads-navigation.test.ts`

16 tests in `bead-row.test.ts` use only `.not.toThrow()`:
```typescript
it("should handle title truncation at narrow widths", () => {
  expect(() => BeadRow({...})).not.toThrow();
  // Never verifies truncation actually works!
});
```

**Impact:** Tests pass even if truncation, icons, or selection styling are broken. False confidence.

**Fix:** Add output assertions that verify actual behavior.

---

### P1-5: useTreeNavigation Hook Untested
**Found by:** Test Quality
**Location:** `beads-navigation.test.ts`

The entire hook test suite contains only import verification. Missing tests for:
- Navigation up/down behavior
- Expand/collapse toggle
- Boundary conditions (first/last node)
- Scroll offset calculation

**Impact:** Critical user-facing functionality at risk of regression.

**Fix:** Add behavioral tests using testing-library render patterns.

---

### P1-6: Components Not Memoized
**Found by:** Performance
**Location:** `bead-row.tsx:38`, `header-bar.tsx:21`, `status-bar.tsx:19`, `detail-panel.tsx:25`

`BeadRow` and other leaf components lack `React.memo`, causing re-renders on every parent state change.

**Impact:** Unnecessary virtual DOM diffing on navigation keystrokes.

**Fix:** Wrap components with `React.memo`:
```typescript
export const BeadRow = React.memo(function BeadRow({ ... }: BeadRowProps) {
```

---

## 4. Minor Issues (P2)

| Issue | Location | Found By | Description |
|-------|----------|----------|-------------|
| ContentHeight can go negative | `bead-tree.tsx:188-191` | Correctness | Add `Math.max(0, contentHeight)` clamp |
| Only first blocker shown | `bead-row.tsx:49` | Correctness, Elegance | Consider `[→id1 +2 more]` format |
| Emoji width varies by terminal | `bead-row.tsx:54` | Correctness, Elegance | Hardcoded `iconLen = 2` may cause misalignment |
| Stale comment | `beads.tsx:180` | Style | Remove "future implementation" comment |
| Return type inconsistency | `detail-panel.tsx:31` | Style | Change `JSX.Element` to `React.JSX.Element` |
| Test helpers duplicated | Multiple test files | Smells | Extract to `__tests__/beads-test-utils.ts` |
| `sendError` method unused | `use-beads-ipc.ts:138-140` | Smells | Remove or document for future use |
| `sendRequestBlockers` never called | `use-beads-ipc.ts:126-128` | Wiring | Remove or add keyboard shortcut |
| Information leakage in logs | Multiple files | Security | Sanitize console.warn/error messages |
| String.repeat negative guard | `header-bar.tsx:26`, `status-bar.tsx:21` | Resilience | Add `Math.max(0, width)` guard |

---

## 5. Wiring Gaps

| Component | Status | Notes |
|-----------|--------|-------|
| DetailPanel | **NOT WIRED** | Component exists, not imported/used |
| detailBeadId state | Tracked but unused | Never read to pass to detail view |
| sendRequestBlockers | Exported but orphan | IPC capability with no UI trigger |
| sendError | Exported but orphan | Consider removal |

---

## 6. Commit Quality

**Assessment:** Exemplary

The commits follow conventional commit standards (`feat(canvas):`) with:
- Clear, descriptive messages
- Proper co-authorship attribution
- Atomic changes (one logical unit per commit)
- Good bisect-ability

No commit discipline issues identified.

---

## 7. Test Quality

**Assessment:** 4/10 - Significant Gaps

**Strengths:**
- `flattenTree` and `getTreePrefix` have comprehensive behavioral tests
- Good edge case coverage (circular refs, depth limits, empty inputs)
- Well-designed test helpers (`makeNode`, `makeFlatNode`)
- Integration test exercises realistic workflow

**Weaknesses:**
- 16+ tests use only `.not.toThrow()` without output verification
- `useTreeNavigation` hook entirely untested for behavior
- No scroll indicator rendering tests
- Test helpers duplicated across 4 files
- Some tests verify static constants (fragile to design changes)

**Recommendation:** Priority 1: Add behavioral tests for BeadRow and useTreeNavigation.

---

## 8. Positive Observations

1. **Defensive Tree Traversal** - `flattenTree` uses visited Set and MAX_DEPTH=50
2. **Clean Hook Architecture** - Single-responsibility hooks with proper cleanup
3. **Performance Optimization** - Windowed rendering, useMemo on expensive ops
4. **Good TypeScript Practices** - `as const`, proper type imports, nullish coalescing
5. **Consistent Style** - Follows existing patterns from flight/document/calendar canvases
6. **Proper Effect Cleanup** - IPC connections cleaned up on unmount
7. **Unknown Status Fallback** - `UNKNOWN_STATUS_ICON` prevents crashes on bad data

---

## 9. Recommendations

### Immediate (Before Merge)
1. Wire up DetailPanel component
2. Remove stale "future implementation" comment

### Short-term (Next Sprint)
1. Add IPC message schema validation (Zod recommended)
2. Add behavioral tests for BeadRow component output
3. Add useTreeNavigation hook behavior tests
4. Add `React.memo` to BeadRow and leaf components
5. Sanitize socket path ID parameter

### Technical Debt to Track
1. Extract duplicated test helpers to shared utility
2. Consolidate duplicate flattenTree tests between files
3. Add error state for IPC connection failures
4. Remove or document unused IPC methods (sendError, sendRequestBlockers)

---

## 10. Files Reviewed (19 total)

**Source Files (11):**
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
- `canvas/src/ipc/client.ts`

**Test Files (4):**
- `canvas/src/__tests__/beads.test.ts`
- `canvas/src/__tests__/bead-row.test.ts`
- `canvas/src/__tests__/bead-tree.test.ts`
- `canvas/src/__tests__/beads-navigation.test.ts`

---

## Leg Cross-Reference

| Finding | Legs That Identified |
|---------|---------------------|
| DetailPanel not wired | Correctness, Elegance, Wiring |
| IPC validation missing | Security, Correctness, Resilience |
| Weak test assertions | Test Quality (both legs) |
| Components need React.memo | Performance |
| Path traversal risk | Security |
| Only first blocker shown | Correctness, Elegance |
| Connection failures silent | Resilience |
| Test helpers duplicated | Smells |

---

*Generated by synthesis leg of PR review workflow*
