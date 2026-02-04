/**
 * Tests for IPC message validation schemas.
 * Verifies runtime validation of messages received from controller.
 */

import { describe, it, expect } from "bun:test";
import {
  parseControllerMessage,
  safeParseControllerMessage,
  parseBeadsConfig,
  safeParseBeadsConfig,
  BeadNodeSchema,
  BeadsConfigSchema,
  ControllerMessageSchema,
} from "../ipc/schemas";

describe("IPC Schemas", () => {
  describe("ControllerMessage validation", () => {
    it("validates close message", () => {
      const msg = { type: "close" };
      const result = safeParseControllerMessage(msg);
      expect(result).toEqual({ type: "close" });
    });

    it("validates update message with config", () => {
      const msg = { type: "update", config: { nodes: [] } };
      const result = safeParseControllerMessage(msg);
      expect(result).toEqual({ type: "update", config: { nodes: [] } });
    });

    it("validates ping message", () => {
      const msg = { type: "ping" };
      const result = safeParseControllerMessage(msg);
      expect(result).toEqual({ type: "ping" });
    });

    it("validates showDetails message with beadId", () => {
      const msg = { type: "showDetails", beadId: "epic.1.2" };
      const result = safeParseControllerMessage(msg);
      expect(result).toEqual({ type: "showDetails", beadId: "epic.1.2" });
    });

    it("rejects message with invalid type", () => {
      const msg = { type: "unknown" };
      const result = safeParseControllerMessage(msg);
      expect(result).toBeNull();
    });

    it("rejects message missing required fields", () => {
      const msg = { type: "showDetails" }; // missing beadId
      const result = safeParseControllerMessage(msg);
      expect(result).toBeNull();
    });

    it("rejects non-object messages", () => {
      expect(safeParseControllerMessage("not an object")).toBeNull();
      expect(safeParseControllerMessage(null)).toBeNull();
      expect(safeParseControllerMessage(123)).toBeNull();
    });

    it("parseControllerMessage throws on invalid message", () => {
      expect(() => parseControllerMessage({ type: "invalid" })).toThrow();
    });
  });

  describe("BeadsConfig validation", () => {
    it("validates minimal config", () => {
      const config = { nodes: [] };
      const result = safeParseBeadsConfig(config);
      expect(result).toEqual({ nodes: [] });
    });

    it("validates config with all optional fields", () => {
      const config = {
        nodes: [],
        title: "My Beads",
        epicIndex: 0,
        totalEpics: 5,
      };
      const result = safeParseBeadsConfig(config);
      expect(result).toEqual(config);
    });

    it("validates config with bead nodes", () => {
      const config = {
        nodes: [
          {
            id: "epic.1",
            title: "First Epic",
            status: "in_progress",
            priority: 1,
          },
        ],
      };
      const result = safeParseBeadsConfig(config);
      expect(result?.nodes[0].id).toBe("epic.1");
      expect(result?.nodes[0].status).toBe("in_progress");
    });

    it("validates nested bead nodes", () => {
      const config = {
        nodes: [
          {
            id: "epic.1",
            title: "Parent",
            status: "pending",
            priority: 1,
            children: [
              {
                id: "epic.1.1",
                title: "Child",
                status: "completed",
                priority: 2,
              },
            ],
          },
        ],
      };
      const result = safeParseBeadsConfig(config);
      expect(result?.nodes[0].children?.[0].id).toBe("epic.1.1");
    });

    it("rejects config with invalid status", () => {
      const config = {
        nodes: [
          {
            id: "epic.1",
            title: "Test",
            status: "invalid_status",
            priority: 1,
          },
        ],
      };
      const result = safeParseBeadsConfig(config);
      expect(result).toBeNull();
    });

    it("rejects config with missing required node fields", () => {
      const config = {
        nodes: [
          {
            id: "epic.1",
            // missing title, status, priority
          },
        ],
      };
      const result = safeParseBeadsConfig(config);
      expect(result).toBeNull();
    });

    it("rejects non-object config", () => {
      expect(safeParseBeadsConfig("not an object")).toBeNull();
      expect(safeParseBeadsConfig(null)).toBeNull();
    });

    it("parseBeadsConfig throws on invalid config", () => {
      expect(() => parseBeadsConfig({ nodes: "not an array" })).toThrow();
    });
  });

  describe("BeadNode validation", () => {
    it("validates node with all valid statuses", () => {
      const statuses = ["pending", "ready", "in_progress", "completed", "blocked"];
      for (const status of statuses) {
        const node = {
          id: "test.1",
          title: "Test",
          status,
          priority: 1,
        };
        const result = BeadNodeSchema.safeParse(node);
        expect(result.success).toBe(true);
      }
    });

    it("validates node with optional fields", () => {
      const node = {
        id: "test.1",
        title: "Test",
        status: "pending",
        priority: 1,
        assignee: "user@example.com",
        blockedBy: ["test.2", "test.3"],
      };
      const result = BeadNodeSchema.safeParse(node);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.assignee).toBe("user@example.com");
        expect(result.data.blockedBy).toEqual(["test.2", "test.3"]);
      }
    });
  });
});
