# Code Smells Review

## Summary

The BeadTree component implementation is clean and well-structured. At 128 lines of new code across 4 files, it follows good separation of concerns with types, components, and tests in separate files. The component functions are appropriately sized (none exceed 30 lines) and nesting is kept reasonable.

The main concerns are speculative generality (unused exports) and a non-null assertion that could cause runtime issues. No critical code smells were identified - this is a net positive addition to the codebase that doesn't add technical debt.

## Critical Issues

None identified.

## Major Issues

**P1-1: Unused interface exported (Speculative Generality)**
- File: `canvas/src/canvases/beads/types.ts:24-27`
- `BeadTreeConfig` interface is defined and exported but never used in any component
- This creates dead code that must be maintained
- **Suggested fix:** Remove `BeadTreeConfig` or add a TODO explaining future use

**P1-2: Unused field in BeadNode interface**
- File: `canvas/src/canvases/beads/types.ts:9`
- `assignee?: string` field is defined but never rendered or used in `BeadTree.tsx`
- Creates confusion about expected data contracts
- **Suggested fix:** Either use `assignee` in rendering or remove until needed

## Minor Issues

**P2-1: Non-null assertion operator**
- File: `canvas/src/canvases/beads/BeadTree.tsx:48`
- `node.children!.length - 1` uses `!` assertion
- While safe in context (inside a guard), it's a code smell that bypasses TypeScript's safety
- **Suggested fix:** Use `node.children?.length ?? 0` or restructure the conditional

**P2-2: Only first blocker shown**
- File: `canvas/src/canvases/beads/BeadTree.tsx:30-32`
- `blockerText` only displays `node.blockedBy[0]`, hiding additional blockers
- **Suggested fix:** Consider showing count: `[→${node.blockedBy[0]}${node.blockedBy.length > 1 ? ` +${node.blockedBy.length - 1}` : ''}]`

**P2-3: Repetitive test imports (Minor DRY violation)**
- File: `canvas/src/__tests__/beads.test.ts:5,11,21`
- `await import("../canvases/beads")` repeated 3 times
- **Suggested fix:** Use `beforeAll` with shared import, or accept as test isolation tradeoff

## Observations

- **Code decomposition is good:** `BeadNodeRow` is extracted as a separate function rather than inline recursion
- **Type safety is solid:** Interfaces are well-defined with appropriate optional fields
- **Tree drawing constants** (TREE_LAST, TREE_MIDDLE, etc.) are clearly named and grouped
- **No TODO/FIXME comments** - clean addition
- **Technical debt assessment:** This PR is debt-neutral to slightly positive. Clean implementation, but speculative exports should be addressed.

### Questions Answered

1. **What will cause pain during the next change?**
   - The unused `BeadTreeConfig` and `assignee` field may confuse future developers about expected functionality
   - The single-blocker display may need rework when users ask "why can't I see all my blockers?"

2. **What would you refactor if you owned this code?**
   - Remove `BeadTreeConfig` until actually needed
   - Either use `assignee` or remove it
   - Show blocker count if multiple exist

3. **Is technical debt being added or paid down?**
   - Mostly neutral. The speculative exports add minor debt, but the overall structure is clean and maintainable.
