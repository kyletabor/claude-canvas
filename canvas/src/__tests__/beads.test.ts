// Beads Canvas Tests

import { describe, test, expect } from "bun:test";
import { BeadTree, STATUS_ICONS } from "../canvases/beads";
import type { BeadNode } from "../canvases/beads";

describe("Beads Canvas", () => {
  describe("Types", () => {
    test("imports BeadNode type", () => {
      const node: BeadNode = {
        id: "test-1",
        title: "Test Node",
        status: "pending",
        priority: 1,
      };
      expect(node.id).toBe("test-1");
    });

    test("BeadNode supports all status types", () => {
      const statuses: BeadNode["status"][] = [
        "pending",
        "ready",
        "in_progress",
        "completed",
        "blocked",
      ];
      expect(statuses.length).toBe(5);
    });

    test("BeadNode supports optional fields", () => {
      const node: BeadNode = {
        id: "test-2",
        title: "Test Node",
        status: "blocked",
        priority: 1,
        assignee: "alice",
        blockedBy: ["test-1"],
        children: [],
      };
      expect(node.assignee).toBe("alice");
      expect(node.blockedBy).toEqual(["test-1"]);
    });
  });

  describe("STATUS_ICONS", () => {
    test("has icon for each status", () => {
      expect(STATUS_ICONS.pending).toBe("📋");
      expect(STATUS_ICONS.ready).toBe("🟢");
      expect(STATUS_ICONS.in_progress).toBe("🔄");
      expect(STATUS_ICONS.completed).toBe("✅");
      expect(STATUS_ICONS.blocked).toBe("🛑");
    });
  });

  describe("BeadTree Component", () => {
    test("imports BeadTree component without throwing", () => {
      expect(BeadTree).toBeDefined();
      expect(typeof BeadTree).toBe("function");
    });
  });

  describe("Sample cc-vkrw epic data", () => {
    const sampleEpic: BeadNode = {
      id: "cc-vkrw",
      title: "Beads Canvas Epic",
      status: "in_progress",
      priority: 1,
      children: [
        {
          id: "cc-vkrw.1",
          title: "Prep",
          status: "completed",
          priority: 1,
        },
        {
          id: "cc-vkrw.2",
          title: "Exploration",
          status: "completed",
          priority: 1,
        },
        {
          id: "cc-vkrw.3",
          title: "Implementation",
          status: "in_progress",
          priority: 1,
          children: [
            {
              id: "cc-vkrw.3.1",
              title: "Static rendering",
              status: "ready",
              priority: 1,
            },
            {
              id: "cc-vkrw.3.2",
              title: "Selection",
              status: "blocked",
              priority: 1,
              blockedBy: ["cc-vkrw.3.1"],
            },
          ],
        },
        {
          id: "cc-vkrw.4",
          title: "Planning",
          status: "in_progress",
          priority: 1,
        },
      ],
    };

    test("sample data has valid structure", () => {
      expect(sampleEpic.id).toBe("cc-vkrw");
      expect(sampleEpic.children?.length).toBe(4);
      expect(sampleEpic.children?.[2].children?.length).toBe(2);
    });

    test("blocked node has blocker reference", () => {
      const blockedNode = sampleEpic.children?.[2].children?.[1];
      expect(blockedNode?.status).toBe("blocked");
      expect(blockedNode?.blockedBy?.[0]).toBe("cc-vkrw.3.1");
    });
  });

  describe("Edge Cases", () => {
    test("node without children (undefined)", () => {
      const node: BeadNode = {
        id: "leaf",
        title: "Leaf Node",
        status: "pending",
        priority: 1,
      };
      expect(node.children).toBeUndefined();
    });

    test("node with empty children array", () => {
      const node: BeadNode = {
        id: "empty-parent",
        title: "Empty Parent",
        status: "pending",
        priority: 1,
        children: [],
      };
      expect(node.children).toEqual([]);
    });

    test("node with multiple blockers (first one should be displayed)", () => {
      const node: BeadNode = {
        id: "multi-blocked",
        title: "Multi Blocked",
        status: "blocked",
        priority: 1,
        blockedBy: ["blocker-1", "blocker-2", "blocker-3"],
      };
      // Component shows first blocker: [→blocker-1]
      expect(node.blockedBy?.[0]).toBe("blocker-1");
    });

    test("node with empty blockedBy array", () => {
      const node: BeadNode = {
        id: "not-blocked",
        title: "Not Blocked",
        status: "ready",
        priority: 1,
        blockedBy: [],
      };
      expect(node.blockedBy?.length).toBe(0);
    });

    test("deeply nested tree (3+ levels)", () => {
      const deepTree: BeadNode = {
        id: "level-0",
        title: "Root",
        status: "in_progress",
        priority: 1,
        children: [
          {
            id: "level-1",
            title: "Level 1",
            status: "in_progress",
            priority: 1,
            children: [
              {
                id: "level-2",
                title: "Level 2",
                status: "in_progress",
                priority: 1,
                children: [
                  {
                    id: "level-3",
                    title: "Level 3",
                    status: "pending",
                    priority: 1,
                  },
                ],
              },
            ],
          },
        ],
      };
      // Verify structure is valid
      const level3 = deepTree.children?.[0].children?.[0].children?.[0];
      expect(level3?.id).toBe("level-3");
    });

    test("minimal node (only required fields)", () => {
      const minimal: BeadNode = {
        id: "min",
        title: "Minimal",
        status: "pending",
        priority: 0,
      };
      expect(minimal.assignee).toBeUndefined();
      expect(minimal.blockedBy).toBeUndefined();
      expect(minimal.children).toBeUndefined();
    });
  });
});
