import { test, expect, describe } from "bun:test";

describe("Beads Canvas", () => {
  test("imports BeadTree component without throwing", async () => {
    const { BeadTree } = await import("../canvases/beads");
    expect(BeadTree).toBeDefined();
    expect(typeof BeadTree).toBe("function");
  });

  test("imports BeadNode type and STATUS_ICONS", async () => {
    const { STATUS_ICONS } = await import("../canvases/beads");
    expect(STATUS_ICONS).toBeDefined();
    expect(STATUS_ICONS.pending).toBe("📋");
    expect(STATUS_ICONS.ready).toBe("🟢");
    expect(STATUS_ICONS.in_progress).toBe("🔄");
    expect(STATUS_ICONS.completed).toBe("✅");
    expect(STATUS_ICONS.blocked).toBe("🛑");
  });

  test("STATUS_ICONS has all expected statuses", async () => {
    const { STATUS_ICONS } = await import("../canvases/beads");
    const statuses = ["pending", "ready", "in_progress", "completed", "blocked"];
    for (const status of statuses) {
      expect(STATUS_ICONS[status as keyof typeof STATUS_ICONS]).toBeDefined();
    }
  });
});
