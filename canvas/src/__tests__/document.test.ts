import { test, expect, describe } from "bun:test";

describe("Document Canvas", () => {
  test("imports Document component without throwing", async () => {
    // This test verifies the module can be imported successfully
    const { Document } = await import("../canvases/document");
    expect(Document).toBeDefined();
    expect(typeof Document).toBe("function");
  });

  test("imports RawMarkdownRenderer without throwing", async () => {
    const { RawMarkdownRenderer } = await import(
      "../canvases/document/components/raw-markdown-renderer"
    );
    expect(RawMarkdownRenderer).toBeDefined();
    expect(typeof RawMarkdownRenderer).toBe("function");
  });
});
