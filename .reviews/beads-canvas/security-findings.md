# Security Review: Beads Canvas

**Reviewer:** jasper (polecat)
**Date:** 2026-02-05
**Scope:** `src/canvases/beads/**/*.ts*`, `src/__tests__/*bead*`, and related IPC modules

## Summary

Overall, the Beads Canvas implementation follows reasonable security practices for a local TUI application. The codebase includes protective measures like circular reference detection and depth limiting. However, several areas need attention, particularly around IPC message validation and socket path construction.

**Risk Level:** Low-Medium (local application with IPC)

## Findings

### HIGH Priority

#### SEC-001: Path Traversal in Socket Path Construction
**File:** `src/ipc/types.ts:50-52`
```typescript
export function getSocketPath(id: string): string {
  return `/tmp/canvas-${id}.sock`;
}
```

**Issue:** The `id` parameter is concatenated directly into the socket path without sanitization. A malicious or corrupted `id` value could enable path traversal attacks.

**Example Attack Vector:**
```typescript
getSocketPath("../../etc/passwd")
// Returns: /tmp/canvas-../../etc/passwd.sock
```

**Recommendation:**
1. Validate that `id` contains only alphanumeric characters, hyphens, and underscores
2. Use `path.basename()` or equivalent to strip directory components
3. Consider using a UUID or hash instead of user-provided values

---

#### SEC-002: Unvalidated IPC Message Handling
**File:** `src/canvases/beads/hooks/use-beads-ipc.ts:76`
```typescript
case "update":
  onUpdateRef.current?.(msg.config as BeadsConfig);
  break;
```

**Issue:** IPC messages are cast directly to expected types without schema validation. A malformed or malicious message from the controller could inject unexpected data.

**Also affected:**
- `src/ipc/client.ts:45` - JSON parsing without schema validation
- `src/canvases/beads/hooks/use-beads-ipc.ts:82` - `msg.beadId` used directly

**Recommendation:**
1. Implement runtime type validation using a library like Zod or io-ts
2. Validate message structure before casting
3. Sanitize string fields (beadId, error messages) before use

---

### MEDIUM Priority

#### SEC-003: Information Leakage via Console Logging
**Files:**
- `src/canvases/beads/components/bead-tree.tsx:40,52`
- `src/canvases/beads/hooks/use-beads-ipc.ts:92,105`
- `src/ipc/client.ts:48`

**Issue:** Console warnings and error messages expose internal implementation details:
```typescript
console.warn(`flattenTree: Circular reference detected for node '${node.id}', skipping`);
console.warn(`flattenTree: Maximum depth (${MAX_DEPTH}) exceeded, truncating`);
console.error("Beads IPC error:", err);
console.error("Failed to connect to controller:", err);
```

**Risk:** Internal node IDs, error details, and IPC connection information could be leaked to logs accessible by other processes or users.

**Recommendation:**
1. Use a structured logging system with configurable log levels
2. Sanitize or redact sensitive information in log messages
3. In production, consider reducing verbosity or using debug-only logging

---

#### SEC-004: Missing Input Validation on IPC Send Functions
**File:** `src/canvases/beads/hooks/use-beads-ipc.ts:118-140`

**Issue:** The send functions accept string parameters directly without validation:
```typescript
const sendBeadSelected = useCallback((beadId: string) => {
  clientRef.current?.send({ type: "beadSelected", beadId });
}, []);
```

**Risk:** While the canvas controls what's sent, this pattern doesn't defend against:
- Extremely long strings causing buffer issues
- Special characters that could be problematic in downstream processing
- Empty strings that may cause unexpected behavior

**Recommendation:**
1. Add length limits for string parameters
2. Validate format of IDs (e.g., regex pattern matching)
3. Sanitize or reject empty/whitespace-only strings

---

### LOW Priority

#### SEC-005: Non-null Assertion Risk
**File:** `src/canvases/beads/components/bead-row.tsx:49`
```typescript
const blockerText = hasBlocker ? ` [→${node.blockedBy![0]}]` : "";
```

**Issue:** Non-null assertion `!` is used after a truthy check, but the check verifies `length > 0` which should be sufficient. However, this pattern is fragile if the check logic changes.

**Recommendation:** Use optional chaining or explicit index check:
```typescript
const blockerText = hasBlocker && node.blockedBy?.[0]
  ? ` [→${node.blockedBy[0]}]`
  : "";
```

---

#### SEC-006: Error Message Exposure in IPC Client
**File:** `src/ipc/client.ts:48`
```typescript
onError?.(new Error(`Failed to parse message: ${line}`));
```

**Issue:** Raw message content is included in error message. If the message contains sensitive data, it would be exposed.

**Recommendation:** Truncate or sanitize the message content in error reporting:
```typescript
const truncated = line.length > 100 ? line.slice(0, 100) + '...' : line;
onError?.(new Error(`Failed to parse message: [${truncated.length} chars]`));
```

---

## Good Practices Observed

The codebase includes several security-positive patterns:

1. **Circular Reference Protection** (`bead-tree.tsx:51-54`): The `flattenTree` function tracks visited nodes to prevent infinite loops from circular references.

2. **Depth Limiting** (`bead-tree.tsx:39-42`): Maximum depth of 50 prevents stack overflow from deeply nested trees.

3. **Proper Effect Cleanup** (`use-beads-ipc.ts:111-115`): IPC connections are properly cleaned up when components unmount, preventing resource leaks.

4. **Ref Pattern for Callbacks** (`use-beads-ipc.ts:49-57`): Using refs to store callback references prevents stale closure issues without causing effect re-runs.

5. **Graceful Empty State Handling** (`bead-tree.tsx:173-179`): The BeadTree component handles empty/undefined nodes arrays without throwing.

6. **Unknown Status Fallback** (`bead-row.tsx:45`): Unknown status values fall back to a defined icon rather than failing.

---

## Test Coverage Assessment

The test files provide good coverage for:
- Import validation
- Type checking
- Edge cases (empty arrays, circular references, deep nesting)
- Component rendering without throwing

**Gap identified:** No explicit security-focused tests for:
- Malformed IPC messages
- Path traversal attempts
- Extremely long input strings
- Special character handling

---

## Recommendations Summary

| Priority | Finding | Action |
|----------|---------|--------|
| HIGH | SEC-001 | Sanitize socket path ID parameter |
| HIGH | SEC-002 | Add runtime schema validation for IPC messages |
| MEDIUM | SEC-003 | Use structured logging with sanitization |
| MEDIUM | SEC-004 | Add input validation to send functions |
| LOW | SEC-005 | Replace non-null assertion with safer pattern |
| LOW | SEC-006 | Sanitize error message content |

---

## OWASP Mapping

| OWASP Category | Findings |
|----------------|----------|
| A03:2021 - Injection | SEC-001, SEC-002 |
| A04:2021 - Insecure Design | SEC-002, SEC-004 |
| A09:2021 - Security Logging Failures | SEC-003, SEC-006 |
