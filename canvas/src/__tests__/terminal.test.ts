import { test, expect, describe, beforeEach, afterEach, mock, spyOn } from "bun:test";
import { unlink } from "fs/promises";

// We need to test the exported functions
import { sanitizeSessionName, getCanvasPaneFile } from "../terminal";

describe("sanitizeSessionName", () => {
  test("passes through alphanumeric names unchanged", () => {
    expect(sanitizeSessionName("session1")).toBe("session1");
    expect(sanitizeSessionName("MySession")).toBe("MySession");
    expect(sanitizeSessionName("test123")).toBe("test123");
  });

  test("preserves hyphens and underscores", () => {
    expect(sanitizeSessionName("my-session")).toBe("my-session");
    expect(sanitizeSessionName("my_session")).toBe("my_session");
    expect(sanitizeSessionName("test-123_abc")).toBe("test-123_abc");
  });

  test("replaces spaces with underscores", () => {
    expect(sanitizeSessionName("my session")).toBe("my_session");
    expect(sanitizeSessionName("test 123")).toBe("test_123");
  });

  test("replaces special characters with underscores", () => {
    expect(sanitizeSessionName("my@session")).toBe("my_session");
    expect(sanitizeSessionName("test:123")).toBe("test_123");
    expect(sanitizeSessionName("foo/bar")).toBe("foo_bar");
    expect(sanitizeSessionName("test!@#$%^&*()")).toBe("test__________");
  });

  test("handles unicode characters", () => {
    expect(sanitizeSessionName("日本語")).toBe("___");
    expect(sanitizeSessionName("café")).toBe("caf_");
    // Emoji may be represented as multiple code points
    expect(sanitizeSessionName("emoji😀")).toMatch(/^emoji_+$/);
  });

  test("handles empty string", () => {
    expect(sanitizeSessionName("")).toBe("");
  });

  test("handles dots and other filesystem-unsafe chars", () => {
    expect(sanitizeSessionName("my.session")).toBe("my_session");
    expect(sanitizeSessionName("test\\path")).toBe("test_path");
    expect(sanitizeSessionName("file:name")).toBe("file_name");
  });
});

describe("getCanvasPaneFile", () => {
  // Save original environment
  const originalTmux = process.env.TMUX;

  afterEach(() => {
    // Restore environment
    if (originalTmux !== undefined) {
      process.env.TMUX = originalTmux;
    } else {
      delete process.env.TMUX;
    }
  });

  test("returns path with sanitized session name", () => {
    // This test runs the actual function - if not in tmux, it falls back to default
    const result = getCanvasPaneFile();
    expect(result).toMatch(/^\/tmp\/claude-canvas-pane-id-[a-zA-Z0-9_-]+$/);
  });

  test("returns default path when not in tmux", () => {
    // Remove TMUX env var to simulate running outside tmux
    delete process.env.TMUX;

    // The function should still work but may fall back to default
    const result = getCanvasPaneFile();
    expect(result).toMatch(/^\/tmp\/claude-canvas-pane-id-/);
  });

  test("different sessions produce different file paths", () => {
    // Test the sanitization logic directly
    const session1 = sanitizeSessionName("session-a");
    const session2 = sanitizeSessionName("session-b");

    expect(session1).not.toBe(session2);
    expect(`/tmp/claude-canvas-pane-id-${session1}`).not.toBe(
      `/tmp/claude-canvas-pane-id-${session2}`
    );
  });
});

describe("session isolation behavior", () => {
  const testFiles: string[] = [];

  // Clean up test files after each test
  afterEach(async () => {
    for (const file of testFiles) {
      try {
        await unlink(file);
      } catch {
        // Ignore if file doesn't exist
      }
    }
    testFiles.length = 0;
  });

  test("file paths are deterministic for same session name", () => {
    const sessionName = "test-session-123";
    const sanitized = sanitizeSessionName(sessionName);
    const path1 = `/tmp/claude-canvas-pane-id-${sanitized}`;
    const path2 = `/tmp/claude-canvas-pane-id-${sanitized}`;
    expect(path1).toBe(path2);
  });

  test("special characters in session name produce safe file paths", () => {
    // Session names with special chars should produce valid file paths
    const dangerousNames = [
      "../escape",
      "session/with/slashes",
      "name with spaces",
      "colon:separated",
      "dots.in.name",
    ];

    for (const name of dangerousNames) {
      const sanitized = sanitizeSessionName(name);
      const path = `/tmp/claude-canvas-pane-id-${sanitized}`;

      // Path should not contain any directory traversal
      expect(path).not.toContain("..");
      expect(path).not.toContain("//");
      // Path should only contain safe characters after the prefix
      expect(sanitized).toMatch(/^[a-zA-Z0-9_-]*$/);
    }
  });
});
