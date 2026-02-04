# Beads Canvas Resilience Review

**Reviewer:** polecat/opal
**Date:** 2026-02-05
**Issue:** cc-vkrw.6.2.5

## Summary

The Beads Canvas implementation shows good defensive patterns in several areas but has gaps in error handling, particularly around IPC communication and edge cases that could cause silent failures.

**Overall Assessment:** MODERATE CONCERNS - Functional but needs hardening for production use.

---

## 1. Missing Error Handling

### 1.1 IPC Client Silent Write Failures
**Location:** `src/ipc/client.ts:68-71`
**Severity:** MEDIUM

```typescript
send(msg: CanvasMessage) {
  if (connected) {
    socket.write(JSON.stringify(msg) + "\n");
  }
}
```

**Issue:** `socket.write()` could fail if the socket is closed but `connected` flag hasn't been updated yet due to async timing. No error handling for write failures.

**Recommendation:** Add try-catch and return success/failure status, or use write callback.

---

### 1.2 IPC Send Functions Don't Verify Connection
**Location:** `src/canvases/beads/hooks/use-beads-ipc.ts:118-140`
**Severity:** LOW

```typescript
const sendBeadSelected = useCallback((beadId: string) => {
  clientRef.current?.send({ type: "beadSelected", beadId });
}, []);
```

**Issue:** All send functions silently do nothing if `clientRef.current` is null. The hook exposes `isConnected` but callers (BeadsCanvas) don't check it before sending.

**Recommendation:** Either:
- Throw if not connected (fail-fast)
- Return boolean indicating if message was queued
- Queue messages for when connection is established

---

### 1.3 Type Casting Without Validation
**Location:** `src/canvases/beads/hooks/use-beads-ipc.ts:76`
**Severity:** MEDIUM

```typescript
case "update":
  onUpdateRef.current?.(msg.config as BeadsConfig);
  break;
```

**Issue:** Direct type assertion without validating the shape of `msg.config`. Malformed data from controller could propagate through the system.

**Recommendation:** Add runtime validation using Zod or manual type guards.

---

### 1.4 No React Error Boundary
**Location:** `src/canvases/beads/beads.tsx`
**Severity:** LOW

**Issue:** No error boundary wrapping the component tree. A rendering error in any child component would crash the entire canvas.

**Recommendation:** Add error boundary at the BeadsCanvas level with fallback UI.

---

## 2. Silent Failures

### 2.1 IPC Connection Failures Only Logged
**Location:** `src/canvases/beads/hooks/use-beads-ipc.ts:104-106`
**Severity:** MEDIUM

```typescript
} catch (err) {
  console.error("Failed to connect to controller:", err);
}
```

**Issue:** Connection failures are logged to console but not surfaced to the user or component state. The canvas would appear to work but all IPC communication would silently fail.

**Recommendation:** Set an error state that can be displayed in the UI.

---

### 2.2 Circular Reference Detection Only Warns
**Location:** `src/canvases/beads/components/bead-tree.tsx:51-53`
**Severity:** LOW

```typescript
if (visited.has(node.id)) {
  console.warn(`flattenTree: Circular reference detected for node '${node.id}', skipping`);
  continue;
}
```

**Issue:** Circular references are logged and skipped, but this is a data integrity issue that should be surfaced. User sees incomplete tree with no indication why.

**Recommendation:** Good that it doesn't crash. Consider adding a visual indicator or collecting warnings to display.

---

### 2.3 Depth Limit Truncation Silent
**Location:** `src/canvases/beads/components/bead-tree.tsx:39-42`
**Severity:** LOW

```typescript
if (depth > MAX_DEPTH) {
  console.warn(`flattenTree: Maximum depth (${MAX_DEPTH}) exceeded, truncating`);
  return [];
}
```

**Issue:** Same as circular references - truncated data with only console output.

---

## 3. Unhandled Edge Cases

### 3.1 Non-Null Assertion on blockedBy Array
**Location:** `src/canvases/beads/components/bead-row.tsx:49`
**Severity:** LOW

```typescript
const blockerText = hasBlocker ? ` [→${node.blockedBy![0]}]` : "";
```

**Issue:** While `hasBlocker` checks `blockedBy.length > 0`, the non-null assertion is still fragile if the check logic changes.

**Recommendation:** Use optional chaining: `node.blockedBy?.[0] ?? ''`

---

### 3.2 Negative Width in String Repeat
**Location:** `src/canvases/beads/components/header-bar.tsx:26`, `status-bar.tsx:21`, `detail-panel.tsx:64,92,110`
**Severity:** LOW

```typescript
const separator = "━".repeat(width);
// detail-panel.tsx:
<Text color={BEAD_COLORS.dim}>{"─".repeat(Math.max(0, width - 4))}</Text>
```

**Issue:** `header-bar.tsx` and `status-bar.tsx` don't guard against negative width which would throw. `detail-panel.tsx` correctly uses `Math.max(0, width - 4)`.

**Recommendation:** Add `Math.max(0, width)` guard consistently.

---

### 3.3 Raw Mode Check
**Location:** `src/canvases/beads/hooks/use-tree-navigation.ts:173`
**Severity:** LOW

```typescript
{ isActive: !!isRawModeSupported }
```

**Issue:** Correctly checks for raw mode support, but if not supported (e.g., piped input), keyboard input silently does nothing. User has no indication why navigation doesn't work.

**Recommendation:** Consider displaying a warning if raw mode is not supported.

---

### 3.4 stdout Undefined
**Location:** `src/canvases/beads/beads.tsx:36,67-78`
**Severity:** LOW

```typescript
const { stdout } = useStdout();
// ...
stdout?.on('resize', updateDimensions);
```

**Issue:** Correctly uses optional chaining, but if `stdout` is undefined, dimensions fall back to 120x40 with no resize handling. This is acceptable graceful degradation.

---

## 4. Graceful Degradation - STRENGTHS

The implementation has several good resilience patterns:

### 4.1 Circular Reference Protection
`flattenTree` uses a `visited` set to detect and skip circular references, preventing infinite loops.

### 4.2 Depth Limiting
`MAX_DEPTH = 50` prevents stack overflow on deeply nested trees.

### 4.3 Empty State Handling
`BeadTree` renders "No beads to display" for empty/undefined nodes.

### 4.4 Unknown Status Fallback
`UNKNOWN_STATUS_ICON` provides fallback for unrecognized status values.

### 4.5 Selection Clamping
`useTreeNavigation` clamps selection index to valid range and adjusts when nodes shrink.

### 4.6 Truncation Helper
`truncate()` function handles edge cases (0/negative length, strings shorter than max).

---

## 5. Recovery Mechanisms

### 5.1 IPC Retry Logic - GOOD
**Location:** `src/ipc/client.ts:86-103`

`connectWithRetry` implements exponential backoff-like retry logic for initial connection.

**Gap:** No reconnection logic if connection drops after initial success. Canvas would become unresponsive.

---

### 5.2 Component Cleanup - GOOD
**Location:** `src/canvases/beads/hooks/use-beads-ipc.ts:111-115`

```typescript
return () => {
  mounted = false;
  clientRef.current?.close();
  clientRef.current = null;
};
```

Properly cleans up connections and prevents state updates after unmount.

---

## 6. Error Propagation Issues

### 6.1 IPC Message Handler Errors
**Location:** `src/canvases/beads/hooks/use-beads-ipc.ts:69-84`

**Issue:** If `onUpdateRef.current?.()` or any other callback throws, it would propagate up and potentially crash the connection handler.

**Recommendation:** Wrap callback invocations in try-catch.

---

### 6.2 Event Handler Errors
**Location:** `src/canvases/beads/beads.tsx:67-79`

**Issue:** If the resize handler throws, it would not be caught.

**Recommendation:** Consider wrapping in try-catch for defensive programming.

---

## Test Coverage Assessment

The test suite (`beads.test.ts`, `bead-tree.test.ts`, `bead-row.test.ts`, `beads-navigation.test.ts`) has good coverage for:

- Edge cases (empty arrays, undefined, null-like values)
- Circular reference handling
- Depth limits
- Component rendering without throwing
- Various status values and selection states

**Gaps in test coverage:**
- IPC error scenarios (connection failure, message parse failure)
- Reconnection behavior
- Raw mode unavailable scenarios
- Concurrent/rapid state changes

---

## Recommendations Summary

| Priority | Issue | Recommendation |
|----------|-------|----------------|
| HIGH | IPC connection failures silent | Add error state and UI feedback |
| MEDIUM | Type casting without validation | Add runtime validation |
| MEDIUM | No reconnection after disconnect | Implement reconnection logic |
| LOW | Negative width in string.repeat | Add Math.max(0, width) guards |
| LOW | Non-null assertion on blockedBy | Use optional chaining |
| LOW | No error boundary | Add React error boundary |

---

## Files Reviewed

- `src/canvases/beads/beads.tsx`
- `src/canvases/beads/types.ts`
- `src/canvases/beads/hooks/use-beads-ipc.ts`
- `src/canvases/beads/hooks/use-tree-navigation.ts`
- `src/canvases/beads/components/bead-tree.tsx`
- `src/canvases/beads/components/bead-row.tsx`
- `src/canvases/beads/components/header-bar.tsx`
- `src/canvases/beads/components/status-bar.tsx`
- `src/canvases/beads/components/detail-panel.tsx`
- `src/ipc/client.ts`
- `src/__tests__/beads.test.ts`
- `src/__tests__/bead-tree.test.ts`
- `src/__tests__/bead-row.test.ts`
- `src/__tests__/beads-navigation.test.ts`
