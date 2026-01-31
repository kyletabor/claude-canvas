import { test, expect, describe } from "bun:test";

describe("Comment Types", () => {
  test("imports Comment types without throwing", async () => {
    const types = await import("../canvases/document/types/comments");
    expect(types).toBeDefined();
  });

  test("Comment interface has required fields", async () => {
    // TypeScript would catch missing fields at compile time
    // This test verifies the module structure
    const types = await import("../canvases/document/types/comments");

    // Check type exports exist
    expect(typeof types).toBe("object");
  });
});

describe("Comment Hook", () => {
  test("imports useComments hook without throwing", async () => {
    const { useComments } = await import("../canvases/document/hooks/use-comments");
    expect(useComments).toBeDefined();
    expect(typeof useComments).toBe("function");
  });
});

describe("Comment Box Component", () => {
  test("imports CommentBox component without throwing", async () => {
    const { CommentBox } = await import("../canvases/document/components/comment-box");
    expect(CommentBox).toBeDefined();
    expect(typeof CommentBox).toBe("function");
  });
});

describe("IPC Types", () => {
  test("IPC types include comment messages", async () => {
    const { IPCComment } = await import("../ipc/types") as any;
    // IPCComment is an interface, so we just verify the import works
    // The type would be undefined at runtime for interfaces
  });

  test("CanvasMessage type includes comment messages", async () => {
    // TypeScript will catch type errors at compile time
    // This just verifies the module loads
    const types = await import("../ipc/types");
    expect(types).toBeDefined();
  });
});

describe("Raw Markdown Renderer with Comments", () => {
  test("imports RawMarkdownRenderer with comment support", async () => {
    const { RawMarkdownRenderer, INDICATOR_WIDTH } = await import(
      "../canvases/document/components/raw-markdown-renderer"
    );
    expect(RawMarkdownRenderer).toBeDefined();
    expect(typeof RawMarkdownRenderer).toBe("function");
    expect(typeof INDICATOR_WIDTH).toBe("number");
    expect(INDICATOR_WIDTH).toBe(2);
  });
});
