# Beads Canvas Wiring Review Findings

**Reviewer:** obsidian (polecat)
**Date:** 2026-02-05
**Task:** cc-vkrw.6.2.8

## Summary

This review examines the Beads Canvas implementation for wiring gaps - code elements that are defined but not connected, or connections that are incomplete.

| Severity | Count |
|----------|-------|
| High | 0 |
| Medium | 2 |
| Low | 1 |
| Informational | 2 |

## Findings

### WR-001: DetailPanel Component Defined but Not Wired [Medium]

**Location:** `canvas/src/canvases/beads/components/detail-panel.tsx` (lines 1-118)

**Issue:** A complete `DetailPanel` component exists with full functionality (keyboard handling, layout, styling) but is never imported or rendered.

**Evidence:**
- `detail-panel.tsx` exports a fully implemented component (118 lines)
- `beads.tsx` does NOT import `DetailPanel`
- Instead, there's a placeholder at lines 172-182:
```tsx
{focusMode === 'detail' && (
  <Box flexDirection="column" /* ... */>
    {/* DetailPanel will be implemented in a future leg */}
  </Box>
)}
```

**Impact:** Users can trigger detail mode (pressing 'o') but see an empty panel instead of bead details.

**Recommendation:** Either:
1. Wire up the existing DetailPanel component
2. Remove the component if detail view is out of scope

---

### WR-002: Focus Mode State Partially Wired [Medium]

**Location:** `canvas/src/canvases/beads/beads.tsx` (lines 51-52, 60-63, 106-110)

**Issue:** State and callbacks for detail view are implemented but not connected to UI.

**Evidence:**
```tsx
// State exists (line 51-52)
const [focusMode, setFocusMode] = useState<FocusMode>('tree');
const [detailBeadId, setDetailBeadId] = useState<string | null>(null);

// IPC callback sets state (line 60-63)
onShowDetails: (beadId) => {
  setDetailBeadId(beadId);
  setFocusMode('detail');
},

// Handler sends IPC and sets state (line 106-110)
const handleDetails = useCallback((beadId: string) => {
  ipc.sendRequestDetails(beadId);
  setDetailBeadId(beadId);
  setFocusMode('detail');
}, [ipc]);
```

But `detailBeadId` is never read to pass to a detail component.

**Impact:** State is tracked but not displayed. The IPC round-trip for detail requests completes but results are unused.

**Recommendation:** Pass `detailBeadId` to DetailPanel when wiring WR-001.

---

### WR-003: IPC Method `sendRequestBlockers` Never Called [Low]

**Location:** `canvas/src/canvases/beads/hooks/use-beads-ipc.ts` (lines 32, 126-128)

**Issue:** The `sendRequestBlockers` method is defined and exported but has no callers.

**Evidence:**
```tsx
// Defined in BeadsIPCHandle interface (line 33)
sendRequestBlockers: (beadId: string) => void;

// Implemented (lines 126-128)
const sendRequestBlockers = useCallback((beadId: string) => {
  clientRef.current?.send({ type: "requestBlockers", beadId });
}, []);
```

The corresponding IPC message type exists in `ipc/types.ts` (line 45):
```tsx
| { type: "requestBlockers"; beadId: string }
```

But no component calls `ipc.sendRequestBlockers()`.

**Impact:** Blocker detail fetching capability exists but is inaccessible to users.

**Recommendation:** Either:
1. Add a keyboard shortcut to request blockers (e.g., 'b' key)
2. Remove if functionality is deferred

---

### WR-004: Exported Hook Types Not Imported Internally [Informational]

**Location:** `canvas/src/canvases/beads/hooks/index.ts`

**Issue:** Four types are exported but never imported within the beads canvas:
- `UseTreeNavigationOptions`
- `UseTreeNavigationResult`
- `UseBeadsIPCOptions`
- `BeadsIPCHandle`

**Analysis:** This is intentional API design - types are exported for external consumers who may need them for TypeScript inference. Not a wiring gap.

**Recommendation:** No action needed. Consider documenting the public API.

---

### WR-005: ink-spinner Dependency Not Used in Beads Canvas [Informational]

**Location:** `package.json`, `canvas/package.json`

**Issue:** The `ink-spinner` package is declared as a dependency but is not imported anywhere in the beads canvas files.

**Analysis:** This dependency may be used by other canvas types (calendar, document, flight). Not specific to beads canvas wiring.

**Recommendation:** Verify usage elsewhere. If unused globally, remove from dependencies.

---

## Wiring Diagram

```
beads.tsx (orchestrator)
├── imports
│   ├── HeaderBar        ✓ used
│   ├── StatusBar        ✓ used (FocusMode type also)
│   ├── BeadTree         ✓ used (flattenTree also)
│   ├── useTreeNavigation ✓ used
│   └── useBeadsIPC      ✓ used
│
├── NOT imported
│   └── DetailPanel      ✗ exists but unwired
│
├── state
│   ├── dimensions       ✓ used in layout
│   ├── config           ✓ used throughout
│   ├── expandedIds      ✓ used for tree
│   ├── focusMode        ~ partially used (checked, but detail panel missing)
│   └── detailBeadId     ✗ set but never read
│
└── IPC methods
    ├── sendBeadSelected     ✓ called in useEffect
    ├── sendRequestDetails   ✓ called in handleDetails
    ├── sendBeadRefresh      ✓ called in handleRefresh
    ├── sendEpicNav          ✓ called in handleEpicNav
    ├── sendError            ~ exported but not used
    └── sendRequestBlockers  ✗ exported but never called
```

## Files Reviewed

- `canvas/src/canvases/beads/index.ts`
- `canvas/src/canvases/beads/beads.tsx`
- `canvas/src/canvases/beads/types.ts`
- `canvas/src/canvases/beads/components/header-bar.tsx`
- `canvas/src/canvases/beads/components/status-bar.tsx`
- `canvas/src/canvases/beads/components/bead-tree.tsx`
- `canvas/src/canvases/beads/components/bead-row.tsx`
- `canvas/src/canvases/beads/components/detail-panel.tsx`
- `canvas/src/canvases/beads/hooks/index.ts`
- `canvas/src/canvases/beads/hooks/use-beads-ipc.ts`
- `canvas/src/canvases/beads/hooks/use-tree-navigation.ts`
- `canvas/src/canvases/index.tsx`
- `canvas/src/ipc/types.ts`
- `package.json`
- `canvas/package.json`
