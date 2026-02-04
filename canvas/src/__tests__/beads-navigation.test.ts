import { test, expect, describe } from "bun:test";

describe("Beads Types", () => {
  test("imports Beads types without throwing", async () => {
    const types = await import("../canvases/beads/types");
    expect(types).toBeDefined();
  });

  test("BeadStatus type includes expected values", async () => {
    const types = await import("../canvases/beads/types");
    expect(types.STATUS_ICONS).toBeDefined();
    expect(types.STATUS_ICONS.pending).toBe("📋");
    expect(types.STATUS_ICONS.ready).toBe("🟢");
    expect(types.STATUS_ICONS.in_progress).toBe("🔄");
    expect(types.STATUS_ICONS.completed).toBe("✅");
    expect(types.STATUS_ICONS.blocked).toBe("🛑");
  });

  test("TREE_CHARS has expected characters", async () => {
    const { TREE_CHARS } = await import("../canvases/beads/types");
    expect(TREE_CHARS.PIPE).toBe("│");
    expect(TREE_CHARS.BRANCH).toBe("├");
    expect(TREE_CHARS.LAST).toBe("└");
    expect(TREE_CHARS.HORIZONTAL).toBe("──");
    expect(TREE_CHARS.EXPANDED).toBe("▼");
    expect(TREE_CHARS.COLLAPSED).toBe("▸");
  });

  test("BEAD_COLORS has expected colors", async () => {
    const { BEAD_COLORS } = await import("../canvases/beads/types");
    expect(BEAD_COLORS.selected).toBe("cyan");
    expect(BEAD_COLORS.header).toBe("magenta");
    expect(BEAD_COLORS.normal).toBe("white");
    expect(BEAD_COLORS.dim).toBe("gray");
    expect(BEAD_COLORS.blocker).toBe("red");
    expect(BEAD_COLORS.priority).toBe("yellow");
  });
});

describe("Tree Navigation Hook", () => {
  test("imports useTreeNavigation without throwing", async () => {
    const { useTreeNavigation } = await import(
      "../canvases/beads/hooks/use-tree-navigation"
    );
    expect(useTreeNavigation).toBeDefined();
    expect(typeof useTreeNavigation).toBe("function");
  });

  test("exports UseTreeNavigationOptions type", async () => {
    const hooks = await import("../canvases/beads/hooks/use-tree-navigation");
    // TypeScript types are not available at runtime, but the module should load
    expect(hooks).toBeDefined();
  });

  test("exports UseTreeNavigationResult type", async () => {
    const hooks = await import("../canvases/beads/hooks/use-tree-navigation");
    expect(hooks).toBeDefined();
  });
});

describe("Beads Hooks Index", () => {
  test("exports useTreeNavigation from index", async () => {
    const { useTreeNavigation } = await import("../canvases/beads/hooks");
    expect(useTreeNavigation).toBeDefined();
    expect(typeof useTreeNavigation).toBe("function");
  });
});
