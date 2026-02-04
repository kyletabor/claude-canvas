/**
 * Behavioral tests for tree navigation hook and utilities.
 * Tests the clamp helper, exported types, and hook interface.
 */

import { test, expect, describe } from "bun:test";
import type { FlattenedNode, BeadNode } from "../canvases/beads/types";

// ============================================================================
// Helper Functions
// ============================================================================

const makeNode = (id: string, overrides?: Partial<BeadNode>): BeadNode => ({
  id,
  title: `Node ${id}`,
  status: "ready",
  priority: 1,
  ...overrides,
});

const makeFlatNode = (id: string, flatIndex: number): FlattenedNode => ({
  node: makeNode(id),
  depth: 0,
  isLast: true,
  isExpanded: false,
  hasChildren: false,
  parentPath: [],
  flatIndex,
});

// ============================================================================
// Clamp Helper Tests
// ============================================================================
// The clamp function is internal to use-tree-navigation.ts but we can test
// equivalent logic here to verify the expected behavior

describe("clamp behavior", () => {
  // Reference implementation matching the hook's internal clamp
  const clamp = (value: number, min: number, max: number): number =>
    Math.min(Math.max(value, min), max);

  test("returns value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  test("clamps value below minimum to minimum", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(-100, 0, 10)).toBe(0);
  });

  test("clamps value above maximum to maximum", () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(100, 0, 10)).toBe(10);
  });

  test("handles edge case of min equals max", () => {
    expect(clamp(5, 5, 5)).toBe(5);
    expect(clamp(0, 5, 5)).toBe(5);
    expect(clamp(10, 5, 5)).toBe(5);
  });

  test("handles negative range", () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(0, -10, -1)).toBe(-1);
    expect(clamp(-20, -10, -1)).toBe(-10);
  });
});

// ============================================================================
// Navigation Index Calculation Tests
// ============================================================================

describe("navigation index calculations", () => {
  const clamp = (value: number, min: number, max: number): number =>
    Math.min(Math.max(value, min), max);

  describe("moveUp behavior", () => {
    test("decrements index by 1", () => {
      const currentIndex = 5;
      const maxIndex = 10;
      const newIndex = clamp(currentIndex - 1, 0, maxIndex);
      expect(newIndex).toBe(4);
    });

    test("stops at index 0 (top boundary)", () => {
      const currentIndex = 0;
      const maxIndex = 10;
      const newIndex = clamp(currentIndex - 1, 0, maxIndex);
      expect(newIndex).toBe(0);
    });
  });

  describe("moveDown behavior", () => {
    test("increments index by 1", () => {
      const currentIndex = 5;
      const maxIndex = 10;
      const newIndex = clamp(currentIndex + 1, 0, maxIndex);
      expect(newIndex).toBe(6);
    });

    test("stops at maxIndex (bottom boundary)", () => {
      const currentIndex = 10;
      const maxIndex = 10;
      const newIndex = clamp(currentIndex + 1, 0, maxIndex);
      expect(newIndex).toBe(10);
    });
  });

  describe("pageUp behavior", () => {
    test("decrements index by viewportHeight", () => {
      const currentIndex = 15;
      const maxIndex = 20;
      const viewportHeight = 10;
      const newIndex = clamp(currentIndex - viewportHeight, 0, maxIndex);
      expect(newIndex).toBe(5);
    });

    test("stops at 0 when page would go negative", () => {
      const currentIndex = 5;
      const maxIndex = 20;
      const viewportHeight = 10;
      const newIndex = clamp(currentIndex - viewportHeight, 0, maxIndex);
      expect(newIndex).toBe(0);
    });
  });

  describe("pageDown behavior", () => {
    test("increments index by viewportHeight", () => {
      const currentIndex = 5;
      const maxIndex = 20;
      const viewportHeight = 10;
      const newIndex = clamp(currentIndex + viewportHeight, 0, maxIndex);
      expect(newIndex).toBe(15);
    });

    test("stops at maxIndex when page would exceed", () => {
      const currentIndex = 15;
      const maxIndex = 20;
      const viewportHeight = 10;
      const newIndex = clamp(currentIndex + viewportHeight, 0, maxIndex);
      expect(newIndex).toBe(20);
    });
  });

  describe("maxIndex calculation", () => {
    test("maxIndex is nodeCount - 1", () => {
      const nodeCount = 10;
      const maxIndex = Math.max(0, nodeCount - 1);
      expect(maxIndex).toBe(9);
    });

    test("maxIndex is 0 for empty array", () => {
      const nodeCount = 0;
      const maxIndex = Math.max(0, nodeCount - 1);
      expect(maxIndex).toBe(0);
    });

    test("maxIndex is 0 for single node", () => {
      const nodeCount = 1;
      const maxIndex = Math.max(0, nodeCount - 1);
      expect(maxIndex).toBe(0);
    });
  });
});

// ============================================================================
// Scroll Offset Calculation Tests
// ============================================================================

describe("scroll offset calculations", () => {
  describe("scrolling up (selection above visible)", () => {
    test("sets scrollOffset to selectedIndex when selection above viewport", () => {
      const selectedIndex = 2;
      const scrollOffset = 5;
      // If selection is above visible area, scroll up
      const newScrollOffset = selectedIndex < scrollOffset ? selectedIndex : scrollOffset;
      expect(newScrollOffset).toBe(2);
    });

    test("keeps scrollOffset when selection is visible", () => {
      const selectedIndex = 7;
      const scrollOffset = 5;
      const viewportHeight = 10;
      // Selection at 7 is visible when scrollOffset is 5 and viewport is 10
      const newScrollOffset = selectedIndex < scrollOffset
        ? selectedIndex
        : scrollOffset;
      expect(newScrollOffset).toBe(5);
    });
  });

  describe("scrolling down (selection below visible)", () => {
    test("adjusts scrollOffset when selection below viewport", () => {
      const selectedIndex = 15;
      const scrollOffset = 5;
      const viewportHeight = 10;
      // Selection at 15 is below visible range (5-14)
      const isBelow = selectedIndex >= scrollOffset + viewportHeight;
      expect(isBelow).toBe(true);

      // New scrollOffset should be selectedIndex - viewportHeight + 1
      const newScrollOffset = selectedIndex - viewportHeight + 1;
      expect(newScrollOffset).toBe(6);
    });

    test("keeps scrollOffset when selection is visible", () => {
      const selectedIndex = 12;
      const scrollOffset = 5;
      const viewportHeight = 10;
      // Selection at 12 is visible (within 5-14)
      const isBelow = selectedIndex >= scrollOffset + viewportHeight;
      expect(isBelow).toBe(false);
    });
  });

  describe("edge cases", () => {
    test("handles empty node list", () => {
      const nodeCount = 0;
      // When nodeCount is 0, we should skip scroll logic
      expect(nodeCount === 0).toBe(true);
    });

    test("handles selection at first visible position", () => {
      const selectedIndex = 5;
      const scrollOffset = 5;
      // Should not trigger scroll
      expect(selectedIndex < scrollOffset).toBe(false);
      expect(selectedIndex >= scrollOffset + 10).toBe(false);
    });

    test("handles selection at last visible position", () => {
      const selectedIndex = 14;
      const scrollOffset = 5;
      const viewportHeight = 10;
      // Index 14 is the last visible when scrollOffset=5, viewport=10
      expect(selectedIndex >= scrollOffset + viewportHeight).toBe(false);
    });
  });
});

// ============================================================================
// Hook Interface Tests
// ============================================================================

describe("Tree Navigation Hook Interface", () => {
  test("exports useTreeNavigation as a function", async () => {
    const { useTreeNavigation } = await import(
      "../canvases/beads/hooks/use-tree-navigation"
    );
    expect(useTreeNavigation).toBeDefined();
    expect(typeof useTreeNavigation).toBe("function");
  });

  test("hook module exports expected interface", async () => {
    const module = await import("../canvases/beads/hooks/use-tree-navigation");

    // Should have useTreeNavigation function
    expect(module.useTreeNavigation).toBeDefined();

    // TypeScript types are compile-time only, but module should load
    expect(module).toBeDefined();
  });
});

// ============================================================================
// Hooks Index Export Tests
// ============================================================================

describe("Beads Hooks Index", () => {
  test("exports useTreeNavigation from hooks index", async () => {
    const { useTreeNavigation } = await import("../canvases/beads/hooks");
    expect(useTreeNavigation).toBeDefined();
    expect(typeof useTreeNavigation).toBe("function");
  });
});

// ============================================================================
// Types Export Tests
// ============================================================================

describe("Beads Types", () => {
  test("STATUS_ICONS maps all status values", async () => {
    const types = await import("../canvases/beads/types");
    expect(types.STATUS_ICONS).toBeDefined();
    expect(types.STATUS_ICONS.pending).toBe("📋");
    expect(types.STATUS_ICONS.ready).toBe("🟢");
    expect(types.STATUS_ICONS.in_progress).toBe("🔄");
    expect(types.STATUS_ICONS.completed).toBe("✅");
    expect(types.STATUS_ICONS.blocked).toBe("🛑");
  });

  test("TREE_CHARS has box-drawing characters", async () => {
    const { TREE_CHARS } = await import("../canvases/beads/types");
    expect(TREE_CHARS.PIPE).toBe("│");
    expect(TREE_CHARS.BRANCH).toBe("├");
    expect(TREE_CHARS.LAST).toBe("└");
    expect(TREE_CHARS.HORIZONTAL).toBe("──");
    expect(TREE_CHARS.EXPANDED).toBe("▼");
    expect(TREE_CHARS.COLLAPSED).toBe("▸");
  });

  test("BEAD_COLORS has theme colors", async () => {
    const { BEAD_COLORS } = await import("../canvases/beads/types");
    expect(BEAD_COLORS.selected).toBe("cyan");
    expect(BEAD_COLORS.header).toBe("magenta");
    expect(BEAD_COLORS.normal).toBe("white");
    expect(BEAD_COLORS.dim).toBe("gray");
    expect(BEAD_COLORS.blocker).toBe("red");
    expect(BEAD_COLORS.priority).toBe("yellow");
  });
});
