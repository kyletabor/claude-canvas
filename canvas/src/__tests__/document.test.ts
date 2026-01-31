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

describe("RawMarkdownRenderer - highlightLine", () => {
  // Import the functions we're testing
  const getHighlightLine = async () => {
    const { highlightLine } = await import(
      "../canvases/document/components/raw-markdown-renderer"
    );
    return highlightLine;
  };

  describe("Headers", () => {
    test("highlights H1 header", async () => {
      const highlightLine = await getHighlightLine();
      const segments = highlightLine("# Hello World");

      expect(segments.length).toBeGreaterThan(0);
      expect(segments[0].text).toBe("#");
      expect(segments[0].color).toBe("cyan");
      expect(segments[0].bold).toBe(true);
    });

    test("highlights H2 header", async () => {
      const highlightLine = await getHighlightLine();
      const segments = highlightLine("## Subheading");

      expect(segments[0].text).toBe("##");
      expect(segments[0].color).toBe("cyan");
      expect(segments[0].bold).toBe(true);
    });

    test("highlights H6 header", async () => {
      const highlightLine = await getHighlightLine();
      const segments = highlightLine("###### Deep heading");

      expect(segments[0].text).toBe("######");
      expect(segments[0].color).toBe("cyan");
    });

    test("does not treat # without space as header", async () => {
      const highlightLine = await getHighlightLine();
      const segments = highlightLine("#notheader");

      // Should not have header styling - first segment should be plain text
      expect(segments[0].text).toBe("#notheader");
      expect(segments[0].color).toBeUndefined();
    });
  });

  describe("Blockquotes", () => {
    test("highlights blockquote", async () => {
      const highlightLine = await getHighlightLine();
      const segments = highlightLine("> This is a quote");

      expect(segments[0].text).toBe("> ");
      expect(segments[0].color).toBe("gray");
      expect(segments[0].bold).toBe(true);
    });

    test("does not treat > without space as blockquote", async () => {
      const highlightLine = await getHighlightLine();
      const segments = highlightLine(">notquote");

      // Should be plain text
      expect(segments[0].text).toBe(">notquote");
    });
  });

  describe("Code blocks", () => {
    test("highlights code block fence", async () => {
      const highlightLine = await getHighlightLine();
      const segments = highlightLine("```javascript");

      expect(segments[0].text).toBe("```javascript");
      expect(segments[0].color).toBe("green");
      expect(segments[0].dimColor).toBe(true);
    });

    test("highlights empty code fence", async () => {
      const highlightLine = await getHighlightLine();
      const segments = highlightLine("```");

      expect(segments[0].text).toBe("```");
      expect(segments[0].color).toBe("green");
    });
  });

  describe("Horizontal rules", () => {
    test("highlights --- horizontal rule", async () => {
      const highlightLine = await getHighlightLine();
      const segments = highlightLine("---");

      expect(segments[0].text).toBe("---");
      expect(segments[0].color).toBe("gray");
      expect(segments[0].dimColor).toBe(true);
    });

    test("highlights *** horizontal rule", async () => {
      const highlightLine = await getHighlightLine();
      const segments = highlightLine("***");

      expect(segments[0].text).toBe("***");
      expect(segments[0].color).toBe("gray");
    });

    test("highlights ___ horizontal rule", async () => {
      const highlightLine = await getHighlightLine();
      const segments = highlightLine("___");

      expect(segments[0].text).toBe("___");
      expect(segments[0].color).toBe("gray");
    });
  });

  describe("List items", () => {
    test("highlights unordered list with dash", async () => {
      const highlightLine = await getHighlightLine();
      const segments = highlightLine("- List item");

      expect(segments[0].text).toBe("-");
      expect(segments[0].color).toBe("yellow");
      expect(segments[0].bold).toBe(true);
    });

    test("highlights unordered list with asterisk", async () => {
      const highlightLine = await getHighlightLine();
      const segments = highlightLine("* List item");

      expect(segments[0].text).toBe("*");
      expect(segments[0].color).toBe("yellow");
    });

    test("highlights unordered list with plus", async () => {
      const highlightLine = await getHighlightLine();
      const segments = highlightLine("+ List item");

      expect(segments[0].text).toBe("+");
      expect(segments[0].color).toBe("yellow");
    });

    test("highlights ordered list", async () => {
      const highlightLine = await getHighlightLine();
      const segments = highlightLine("1. First item");

      expect(segments[0].text).toBe("1.");
      expect(segments[0].color).toBe("yellow");
    });

    test("highlights indented list item", async () => {
      const highlightLine = await getHighlightLine();
      const segments = highlightLine("  - Nested item");

      expect(segments[0].text).toBe("  ");  // indentation
      expect(segments[1].text).toBe("-");
      expect(segments[1].color).toBe("yellow");
    });
  });

  describe("Plain text", () => {
    test("returns plain text without special styling", async () => {
      const highlightLine = await getHighlightLine();
      const segments = highlightLine("Just some plain text");

      // Should have segments but no special color
      expect(segments.length).toBeGreaterThan(0);
      const fullText = segments.map(s => s.text).join("");
      expect(fullText).toBe("Just some plain text");
    });

    test("handles empty line", async () => {
      const highlightLine = await getHighlightLine();
      const segments = highlightLine("");

      expect(segments).toEqual([]);
    });
  });
});

describe("RawMarkdownRenderer - highlightInline", () => {
  const getHighlightInline = async () => {
    const { highlightInline } = await import(
      "../canvases/document/components/raw-markdown-renderer"
    );
    return highlightInline;
  };

  describe("Inline code", () => {
    test("highlights inline code", async () => {
      const highlightInline = await getHighlightInline();
      const segments = highlightInline("Use `code` here");

      expect(segments.length).toBeGreaterThan(0);

      // Find the code segments
      const codeSegments = segments.filter(s => s.color === "green");
      expect(codeSegments.length).toBe(3);  // backtick, code, backtick
      expect(codeSegments[1].text).toBe("code");
    });

    test("handles multiple inline code spans", async () => {
      const highlightInline = await getHighlightInline();
      const segments = highlightInline("`a` and `b`");

      const codeSegments = segments.filter(s => s.color === "green");
      expect(codeSegments.length).toBe(6);  // 3 per code span
    });
  });

  describe("Bold text", () => {
    test("highlights bold text with **", async () => {
      const highlightInline = await getHighlightInline();
      const segments = highlightInline("This is **bold** text");

      const boldSegments = segments.filter(s => s.bold === true);
      expect(boldSegments.length).toBeGreaterThan(0);

      const boldText = boldSegments.find(s => s.text === "bold");
      expect(boldText).toBeDefined();
      expect(boldText?.color).toBe("yellow");
    });
  });

  describe("Italic text", () => {
    test("highlights italic text with *", async () => {
      const highlightInline = await getHighlightInline();
      const segments = highlightInline("This is *italic* text");

      const italicSegments = segments.filter(s => s.italic === true);
      expect(italicSegments.length).toBeGreaterThan(0);

      const italicText = italicSegments.find(s => s.text === "italic");
      expect(italicText).toBeDefined();
      expect(italicText?.color).toBe("magenta");
    });
  });

  describe("Links", () => {
    test("highlights markdown links", async () => {
      const highlightInline = await getHighlightInline();
      const segments = highlightInline("Click [here](https://example.com)");

      // Find link text
      const linkText = segments.find(s => s.text === "here" && s.color === "blue");
      expect(linkText).toBeDefined();

      // Find URL (dimmed)
      const urlText = segments.find(s => s.text === "https://example.com");
      expect(urlText).toBeDefined();
      expect(urlText?.dimColor).toBe(true);
    });
  });

  describe("Mixed inline formatting", () => {
    test("handles multiple inline styles in one line", async () => {
      const highlightInline = await getHighlightInline();
      const segments = highlightInline("Text with `code` and **bold** and *italic*");

      // Should have code, bold, and italic segments
      const hasCode = segments.some(s => s.color === "green");
      const hasBold = segments.some(s => s.bold === true && s.text === "bold");
      const hasItalic = segments.some(s => s.italic === true && s.text === "italic");

      expect(hasCode).toBe(true);
      expect(hasBold).toBe(true);
      expect(hasItalic).toBe(true);
    });
  });

  describe("Base style inheritance", () => {
    test("applies base style to all segments", async () => {
      const highlightInline = await getHighlightInline();
      const segments = highlightInline("Some text", { dimColor: true });

      // All segments should inherit dimColor
      for (const segment of segments) {
        expect(segment.dimColor).toBe(true);
      }
    });
  });
});

describe("Text Selection - offsetToLineCol", () => {
  const getOffsetToLineCol = async () => {
    const { offsetToLineCol } = await import(
      "../canvases/document/hooks/use-text-selection"
    );
    return offsetToLineCol;
  };

  test("converts offset 0 to line 1, column 1", async () => {
    const offsetToLineCol = await getOffsetToLineCol();
    const result = offsetToLineCol(0, "Hello\nWorld");

    expect(result.line).toBe(1);
    expect(result.column).toBe(1);
  });

  test("converts offset at start of second line", async () => {
    const offsetToLineCol = await getOffsetToLineCol();
    const result = offsetToLineCol(6, "Hello\nWorld");

    expect(result.line).toBe(2);
    expect(result.column).toBe(1);
  });

  test("converts offset in middle of line", async () => {
    const offsetToLineCol = await getOffsetToLineCol();
    const result = offsetToLineCol(3, "Hello\nWorld");

    expect(result.line).toBe(1);
    expect(result.column).toBe(4);  // 0-indexed offset 3 = column 4
  });

  test("handles multiple lines", async () => {
    const offsetToLineCol = await getOffsetToLineCol();
    const content = "Line 1\nLine 2\nLine 3";

    // Offset 14 is start of "Line 3" (7 chars + newline + 7 chars)
    const result = offsetToLineCol(14, content);

    expect(result.line).toBe(3);
    expect(result.column).toBe(1);
  });

  test("handles empty content", async () => {
    const offsetToLineCol = await getOffsetToLineCol();
    const result = offsetToLineCol(0, "");

    expect(result.line).toBe(1);
    expect(result.column).toBe(1);
  });

  test("clamps offset beyond content length", async () => {
    const offsetToLineCol = await getOffsetToLineCol();
    const result = offsetToLineCol(100, "Short");

    // Should handle gracefully - line 1, column at end
    expect(result.line).toBe(1);
    expect(result.column).toBe(6);  // "Short" is 5 chars, so column 6
  });
});

describe("Text Selection - terminalToOffset", () => {
  const getTerminalToOffset = async () => {
    const { terminalToOffset } = await import(
      "../canvases/document/hooks/use-text-selection"
    );
    return terminalToOffset;
  };

  test("finds exact match in position map", async () => {
    const terminalToOffset = await getTerminalToOffset();
    const positionMap = [
      { terminalRow: 1, terminalCol: 1, sourceOffset: 0 },
      { terminalRow: 1, terminalCol: 2, sourceOffset: 1 },
      { terminalRow: 1, terminalCol: 3, sourceOffset: 2 },
    ];

    const offset = terminalToOffset(2, 1, positionMap);
    expect(offset).toBe(1);
  });

  test("finds closest column on same row", async () => {
    const terminalToOffset = await getTerminalToOffset();
    const positionMap = [
      { terminalRow: 1, terminalCol: 1, sourceOffset: 0 },
      { terminalRow: 1, terminalCol: 5, sourceOffset: 4 },
      { terminalRow: 1, terminalCol: 10, sourceOffset: 9 },
    ];

    // Column 3 is equidistant from col 1 and col 5, reduce returns the one encountered first
    // in the iteration (col 1 → offset 0)
    const offset = terminalToOffset(3, 1, positionMap);
    expect(offset).toBe(0);  // Distance to col 1 = 2, distance to col 5 = 2, first wins
  });

  test("finds column when farther from first entry", async () => {
    const terminalToOffset = await getTerminalToOffset();
    const positionMap = [
      { terminalRow: 1, terminalCol: 1, sourceOffset: 0 },
      { terminalRow: 1, terminalCol: 5, sourceOffset: 4 },
      { terminalRow: 1, terminalCol: 10, sourceOffset: 9 },
    ];

    // Column 8 is closest to column 10
    const offset = terminalToOffset(8, 1, positionMap);
    expect(offset).toBe(9);  // Distance to col 10 = 2, which is less than col 5 = 3
  });

  test("throws error for empty position map", async () => {
    const terminalToOffset = await getTerminalToOffset();
    // Empty position map causes an error (reduce on empty array)
    expect(() => terminalToOffset(1, 1, [])).toThrow();
  });

  test("finds closest row when exact row not found", async () => {
    const terminalToOffset = await getTerminalToOffset();
    const positionMap = [
      { terminalRow: 1, terminalCol: 1, sourceOffset: 0 },
      { terminalRow: 3, terminalCol: 1, sourceOffset: 10 },
    ];

    // Row 2 should find closest row (1 or 3)
    const offset = terminalToOffset(1, 2, positionMap);
    expect(offset).not.toBeNull();
  });

  test("handles y below all rows (returns end of closest row)", async () => {
    const terminalToOffset = await getTerminalToOffset();
    const positionMap = [
      { terminalRow: 1, terminalCol: 1, sourceOffset: 0 },
      { terminalRow: 1, terminalCol: 5, sourceOffset: 4 },
    ];

    // Row 10 is way below - should find closest
    const offset = terminalToOffset(1, 10, positionMap);
    expect(offset).toBe(4);  // Max offset on closest row
  });

  test("handles y above all rows (returns start of closest row)", async () => {
    const terminalToOffset = await getTerminalToOffset();
    const positionMap = [
      { terminalRow: 5, terminalCol: 1, sourceOffset: 20 },
      { terminalRow: 5, terminalCol: 10, sourceOffset: 29 },
    ];

    // Row 1 is above - should find closest
    const offset = terminalToOffset(1, 1, positionMap);
    expect(offset).toBe(20);  // Min offset on closest row
  });
});

describe("Selection State Management", () => {
  test("exports useTextSelection hook", async () => {
    const { useTextSelection } = await import(
      "../canvases/document/hooks/use-text-selection"
    );
    expect(useTextSelection).toBeDefined();
    expect(typeof useTextSelection).toBe("function");
  });
});

describe("Document Types", () => {
  test("exports DocumentConfig interface structure", async () => {
    const types = await import("../canvases/document/types");

    expect(types.MARKDOWN_STYLES).toBeDefined();
    expect(types.DIFF_STYLES).toBeDefined();
    expect(types.SELECTION_STYLE).toBeDefined();
  });

  test("MARKDOWN_STYLES has expected keys", async () => {
    const { MARKDOWN_STYLES } = await import("../canvases/document/types");

    expect(MARKDOWN_STYLES.h1).toBeDefined();
    expect(MARKDOWN_STYLES.h2).toBeDefined();
    expect(MARKDOWN_STYLES.bold).toBeDefined();
    expect(MARKDOWN_STYLES.italic).toBeDefined();
    expect(MARKDOWN_STYLES.code).toBeDefined();
    expect(MARKDOWN_STYLES.link).toBeDefined();
  });

  test("DIFF_STYLES has add and delete", async () => {
    const { DIFF_STYLES } = await import("../canvases/document/types");

    expect(DIFF_STYLES.add).toBeDefined();
    expect(DIFF_STYLES.add.backgroundColor).toBe("green");
    expect(DIFF_STYLES.delete).toBeDefined();
    expect(DIFF_STYLES.delete.backgroundColor).toBe("red");
  });
});

describe("SYNTAX_COLORS", () => {
  test("exports SYNTAX_COLORS constant", async () => {
    const { SYNTAX_COLORS } = await import(
      "../canvases/document/components/raw-markdown-renderer"
    );

    expect(SYNTAX_COLORS).toBeDefined();
    expect(SYNTAX_COLORS.header).toBe("cyan");
    expect(SYNTAX_COLORS.bold).toBe("yellow");
    expect(SYNTAX_COLORS.italic).toBe("magenta");
    expect(SYNTAX_COLORS.code).toBe("green");
    expect(SYNTAX_COLORS.link).toBe("blue");
  });
});
