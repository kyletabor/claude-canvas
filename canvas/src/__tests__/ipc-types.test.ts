import { test, expect, describe } from "bun:test";
import { getSocketPath } from "../ipc/types";

describe("getSocketPath", () => {
  describe("valid IDs", () => {
    test("accepts alphanumeric IDs", () => {
      expect(getSocketPath("abc123")).toBe("/tmp/canvas-abc123.sock");
      expect(getSocketPath("TestId")).toBe("/tmp/canvas-TestId.sock");
      expect(getSocketPath("123")).toBe("/tmp/canvas-123.sock");
    });

    test("accepts IDs with hyphens", () => {
      expect(getSocketPath("my-canvas")).toBe("/tmp/canvas-my-canvas.sock");
      expect(getSocketPath("a-b-c")).toBe("/tmp/canvas-a-b-c.sock");
    });

    test("accepts IDs with underscores", () => {
      expect(getSocketPath("my_canvas")).toBe("/tmp/canvas-my_canvas.sock");
      expect(getSocketPath("a_b_c")).toBe("/tmp/canvas-a_b_c.sock");
    });

    test("accepts mixed valid characters", () => {
      expect(getSocketPath("my-canvas_123")).toBe("/tmp/canvas-my-canvas_123.sock");
      expect(getSocketPath("Test_ID-456")).toBe("/tmp/canvas-Test_ID-456.sock");
    });
  });

  describe("invalid IDs - path traversal attempts", () => {
    test("rejects path traversal with ../", () => {
      expect(() => getSocketPath("../../etc/passwd")).toThrow("Invalid socket ID");
    });

    test("rejects path traversal with ..\\", () => {
      expect(() => getSocketPath("..\\..\\etc\\passwd")).toThrow("Invalid socket ID");
    });

    test("rejects IDs containing slashes", () => {
      expect(() => getSocketPath("foo/bar")).toThrow("Invalid socket ID");
      expect(() => getSocketPath("/tmp/malicious")).toThrow("Invalid socket ID");
    });

    test("rejects IDs containing backslashes", () => {
      expect(() => getSocketPath("foo\\bar")).toThrow("Invalid socket ID");
    });

    test("rejects IDs containing dots", () => {
      expect(() => getSocketPath("my.canvas")).toThrow("Invalid socket ID");
      expect(() => getSocketPath("..")).toThrow("Invalid socket ID");
    });
  });

  describe("invalid IDs - other special characters", () => {
    test("rejects IDs with spaces", () => {
      expect(() => getSocketPath("my canvas")).toThrow("Invalid socket ID");
    });

    test("rejects IDs with special characters", () => {
      expect(() => getSocketPath("my@canvas")).toThrow("Invalid socket ID");
      expect(() => getSocketPath("my:canvas")).toThrow("Invalid socket ID");
      expect(() => getSocketPath("my$canvas")).toThrow("Invalid socket ID");
      expect(() => getSocketPath("my%canvas")).toThrow("Invalid socket ID");
      expect(() => getSocketPath("my*canvas")).toThrow("Invalid socket ID");
    });

    test("rejects IDs with null bytes", () => {
      expect(() => getSocketPath("my\0canvas")).toThrow("Invalid socket ID");
    });
  });

  describe("edge cases", () => {
    test("rejects empty string", () => {
      expect(() => getSocketPath("")).toThrow("Invalid socket ID");
    });

    test("rejects whitespace-only string", () => {
      expect(() => getSocketPath("   ")).toThrow("Invalid socket ID");
    });

    test("handles single character IDs", () => {
      expect(getSocketPath("a")).toBe("/tmp/canvas-a.sock");
      expect(getSocketPath("1")).toBe("/tmp/canvas-1.sock");
      expect(getSocketPath("-")).toBe("/tmp/canvas--.sock");
      expect(getSocketPath("_")).toBe("/tmp/canvas-_.sock");
    });

    test("handles long IDs", () => {
      const longId = "a".repeat(100);
      expect(getSocketPath(longId)).toBe(`/tmp/canvas-${longId}.sock`);
    });
  });
});
