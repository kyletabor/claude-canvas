/**
 * Behavioral tests for BeadRow component.
 * Tests truncation logic, status icons, blocker indicators, and JSX output structure.
 */

import { describe, expect, it } from "bun:test";
import type { BeadNode, FlattenedNode } from "../canvases/beads/types";
import { STATUS_ICONS, UNKNOWN_STATUS_ICON, BEAD_COLORS } from "../canvases/beads/types";

const makeNode = (overrides: Partial<BeadNode> = {}): BeadNode => ({
  id: "test-1",
  title: "Test Bead",
  status: "pending",
  priority: 1,
  ...overrides,
});

const makeFlatNode = (
  nodeOverrides: Partial<BeadNode> = {},
  flatOverrides: Partial<Omit<FlattenedNode, "node">> = {}
): FlattenedNode => ({
  node: makeNode(nodeOverrides),
  depth: 0,
  isLast: true,
  isExpanded: false,
  hasChildren: false,
  parentPath: [],
  flatIndex: 0,
  ...flatOverrides,
});

// Helper to extract text content from React elements
function extractText(element: React.ReactElement | null): string {
  if (!element) return "";

  const texts: string[] = [];

  function traverse(node: unknown): void {
    if (node === null || node === undefined) return;
    if (typeof node === "string" || typeof node === "number") {
      texts.push(String(node));
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(traverse);
      return;
    }
    if (typeof node === "object" && node !== null) {
      const elem = node as { props?: { children?: unknown } };
      if (elem.props?.children !== undefined) {
        traverse(elem.props.children);
      }
    }
  }

  traverse(element);
  return texts.join("");
}

// Helper to find elements with specific props
function findElementsWithProp(
  element: React.ReactElement | null,
  propName: string,
  propValue: unknown
): unknown[] {
  const found: unknown[] = [];

  function traverse(node: unknown): void {
    if (node === null || node === undefined) return;
    if (Array.isArray(node)) {
      node.forEach(traverse);
      return;
    }
    if (typeof node === "object" && node !== null) {
      const elem = node as { props?: Record<string, unknown> };
      if (elem.props?.[propName] === propValue) {
        found.push(elem);
      }
      if (elem.props?.children !== undefined) {
        traverse(elem.props.children);
      }
    }
  }

  traverse(element);
  return found;
}

describe("BeadRow Component", () => {
  describe("module exports", () => {
    it("exports BeadRow as a function component", async () => {
      const { BeadRow } = await import("../canvases/beads/components/bead-row");
      expect(BeadRow).toBeDefined();
      expect(typeof BeadRow).toBe("function");
    });
  });

  describe("truncation behavior", () => {
    it("displays full title when width is sufficient", async () => {
      const { BeadRow } = await import("../canvases/beads/components/bead-row");
      const flat = makeFlatNode({ title: "Short" });

      const result = BeadRow({ flat, isSelected: false, width: 100 });
      const text = extractText(result);

      expect(text).toContain("Short");
      expect(text).not.toContain("…");
    });

    it("truncates title with ellipsis when width is narrow", async () => {
      const { BeadRow } = await import("../canvases/beads/components/bead-row");
      const flat = makeFlatNode({ title: "A very long title that will need truncation" });

      // Width 20 minus: id "test-1" (6) + icon (2) + spacer (2) = 10 for title
      const result = BeadRow({ flat, isSelected: false, width: 20 });
      const text = extractText(result);

      expect(text).toContain("…");
    });

    it("returns empty title when width leaves no space", async () => {
      const { BeadRow } = await import("../canvases/beads/components/bead-row");
      const flat = makeFlatNode({ title: "Any title" });

      // Width 0 should result in no title
      const result = BeadRow({ flat, isSelected: false, width: 0 });
      const text = extractText(result);

      // Should have id and icon but truncated/empty title
      expect(text).toContain("test-1");
    });

    it("handles title with exactly max length", async () => {
      const { BeadRow } = await import("../canvases/beads/components/bead-row");
      // Create a title that should fit exactly
      const flat = makeFlatNode({ title: "Exact" });

      const result = BeadRow({ flat, isSelected: false, width: 80 });
      const text = extractText(result);

      expect(text).toContain("Exact");
      expect(text).not.toContain("…");
    });
  });

  describe("status icon display", () => {
    it("displays pending icon for pending status", async () => {
      const { BeadRow } = await import("../canvases/beads/components/bead-row");
      const flat = makeFlatNode({ status: "pending" });

      const result = BeadRow({ flat, isSelected: false, width: 80 });
      const text = extractText(result);

      expect(text).toContain(STATUS_ICONS.pending);
    });

    it("displays ready icon for ready status", async () => {
      const { BeadRow } = await import("../canvases/beads/components/bead-row");
      const flat = makeFlatNode({ status: "ready" });

      const result = BeadRow({ flat, isSelected: false, width: 80 });
      const text = extractText(result);

      expect(text).toContain(STATUS_ICONS.ready);
    });

    it("displays in_progress icon for in_progress status", async () => {
      const { BeadRow } = await import("../canvases/beads/components/bead-row");
      const flat = makeFlatNode({ status: "in_progress" });

      const result = BeadRow({ flat, isSelected: false, width: 80 });
      const text = extractText(result);

      expect(text).toContain(STATUS_ICONS.in_progress);
    });

    it("displays completed icon for completed status", async () => {
      const { BeadRow } = await import("../canvases/beads/components/bead-row");
      const flat = makeFlatNode({ status: "completed" });

      const result = BeadRow({ flat, isSelected: false, width: 80 });
      const text = extractText(result);

      expect(text).toContain(STATUS_ICONS.completed);
    });

    it("displays blocked icon for blocked status", async () => {
      const { BeadRow } = await import("../canvases/beads/components/bead-row");
      const flat = makeFlatNode({ status: "blocked" });

      const result = BeadRow({ flat, isSelected: false, width: 80 });
      const text = extractText(result);

      expect(text).toContain(STATUS_ICONS.blocked);
    });

    it("displays fallback icon for unknown status", async () => {
      const { BeadRow } = await import("../canvases/beads/components/bead-row");
      const flat = makeFlatNode({ status: "unknown" as BeadNode["status"] });

      const result = BeadRow({ flat, isSelected: false, width: 80 });
      const text = extractText(result);

      expect(text).toContain(UNKNOWN_STATUS_ICON);
    });
  });

  describe("blocker indicator", () => {
    it("displays blocker indicator when blocked with blockedBy", async () => {
      const { BeadRow } = await import("../canvases/beads/components/bead-row");
      const flat = makeFlatNode({ status: "blocked", blockedBy: ["other-1"] });

      const result = BeadRow({ flat, isSelected: false, width: 80 });
      const text = extractText(result);

      expect(text).toContain("[→other-1]");
    });

    it("displays first blocker when multiple blockedBy", async () => {
      const { BeadRow } = await import("../canvases/beads/components/bead-row");
      const flat = makeFlatNode({ status: "blocked", blockedBy: ["first", "second"] });

      const result = BeadRow({ flat, isSelected: false, width: 80 });
      const text = extractText(result);

      expect(text).toContain("[→first]");
      expect(text).not.toContain("second");
    });

    it("does not display blocker indicator when blocked but empty blockedBy", async () => {
      const { BeadRow } = await import("../canvases/beads/components/bead-row");
      const flat = makeFlatNode({ status: "blocked", blockedBy: [] });

      const result = BeadRow({ flat, isSelected: false, width: 80 });
      const text = extractText(result);

      expect(text).not.toContain("[→");
    });

    it("does not display blocker indicator for non-blocked status even with blockedBy", async () => {
      const { BeadRow } = await import("../canvases/beads/components/bead-row");
      const flat = makeFlatNode({ status: "pending", blockedBy: ["other-1"] });

      const result = BeadRow({ flat, isSelected: false, width: 80 });
      const text = extractText(result);

      expect(text).not.toContain("[→");
    });

    it("blocker indicator uses red color", async () => {
      const { BeadRow } = await import("../canvases/beads/components/bead-row");
      const flat = makeFlatNode({ status: "blocked", blockedBy: ["blocker-1"] });

      const result = BeadRow({ flat, isSelected: false, width: 80 });
      const redElements = findElementsWithProp(result, "color", BEAD_COLORS.blocker);

      expect(redElements.length).toBeGreaterThan(0);
    });
  });

  describe("selection styling", () => {
    it("applies inverse style when selected", async () => {
      const { BeadRow } = await import("../canvases/beads/components/bead-row");
      const flat = makeFlatNode();

      const result = BeadRow({ flat, isSelected: true, width: 80 });
      const inverseElements = findElementsWithProp(result, "inverse", true);

      expect(inverseElements.length).toBeGreaterThan(0);
    });

    it("does not apply inverse style when not selected", async () => {
      const { BeadRow } = await import("../canvases/beads/components/bead-row");
      const flat = makeFlatNode();

      const result = BeadRow({ flat, isSelected: false, width: 80 });
      const inverseElements = findElementsWithProp(result, "inverse", true);

      expect(inverseElements.length).toBe(0);
    });

    it("uses cyan color for selected text", async () => {
      const { BeadRow } = await import("../canvases/beads/components/bead-row");
      const flat = makeFlatNode();

      const result = BeadRow({ flat, isSelected: true, width: 80 });
      const cyanElements = findElementsWithProp(result, "color", BEAD_COLORS.selected);

      expect(cyanElements.length).toBeGreaterThan(0);
    });
  });

  describe("node id display", () => {
    it("displays the node id", async () => {
      const { BeadRow } = await import("../canvases/beads/components/bead-row");
      const flat = makeFlatNode({ id: "my-bead-id" });

      const result = BeadRow({ flat, isSelected: false, width: 80 });
      const text = extractText(result);

      expect(text).toContain("my-bead-id");
    });

    it("displays node id with dim color", async () => {
      const { BeadRow } = await import("../canvases/beads/components/bead-row");
      const flat = makeFlatNode({ id: "test-id" });

      const result = BeadRow({ flat, isSelected: false, width: 80 });
      const dimElements = findElementsWithProp(result, "color", BEAD_COLORS.dim);

      expect(dimElements.length).toBeGreaterThan(0);
    });
  });

  describe("edge cases", () => {
    it("handles empty title", async () => {
      const { BeadRow } = await import("../canvases/beads/components/bead-row");
      const flat = makeFlatNode({ title: "" });

      const result = BeadRow({ flat, isSelected: false, width: 80 });
      const text = extractText(result);

      // Should still have id and icon
      expect(text).toContain("test-1");
      expect(text).toContain(STATUS_ICONS.pending);
    });

    it("handles special characters in title", async () => {
      const { BeadRow } = await import("../canvases/beads/components/bead-row");
      const flat = makeFlatNode({ title: "Special <chars> & \"quotes\"" });

      const result = BeadRow({ flat, isSelected: false, width: 100 });
      const text = extractText(result);

      expect(text).toContain("Special <chars>");
    });

    it("handles emoji in title", async () => {
      const { BeadRow } = await import("../canvases/beads/components/bead-row");
      const flat = makeFlatNode({ title: "🎉 Celebration" });

      const result = BeadRow({ flat, isSelected: false, width: 100 });
      const text = extractText(result);

      expect(text).toContain("🎉");
    });

    it("handles undefined blockedBy gracefully", async () => {
      const { BeadRow } = await import("../canvases/beads/components/bead-row");
      const node = makeNode({ status: "blocked" });
      // Delete blockedBy to simulate undefined
      delete (node as unknown as Record<string, unknown>).blockedBy;
      const flat: FlattenedNode = {
        node,
        depth: 0,
        isLast: true,
        isExpanded: false,
        hasChildren: false,
        parentPath: [],
        flatIndex: 0,
      };

      const result = BeadRow({ flat, isSelected: false, width: 80 });
      const text = extractText(result);

      // Should not crash and should not show blocker indicator
      expect(text).toContain("test-1");
      expect(text).not.toContain("[→");
    });
  });
});
