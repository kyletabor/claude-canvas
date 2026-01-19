// Tests for document tab functionality

import { describe, it, expect } from "bun:test";
import {
  TabDocument,
  TabbedDocumentConfig,
  isTabbedConfig,
  normalizeToTabs,
  validateActiveTab,
  DocumentConfig,
} from "../types";

describe("isTabbedConfig", () => {
  it("returns true for TabbedDocumentConfig", () => {
    const config: TabbedDocumentConfig = {
      documents: [
        { title: "Doc 1", content: "Content 1" },
        { title: "Doc 2", content: "Content 2" },
      ],
    };
    expect(isTabbedConfig(config)).toBe(true);
  });

  it("returns false for DocumentConfig", () => {
    const config: DocumentConfig = {
      content: "Some content",
      title: "My Doc",
    };
    expect(isTabbedConfig(config)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isTabbedConfig(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isTabbedConfig(undefined)).toBe(false);
  });

  it("returns false for empty object", () => {
    expect(isTabbedConfig({})).toBe(false);
  });

  it("returns false when documents is not an array", () => {
    const config = { documents: "not an array" };
    expect(isTabbedConfig(config)).toBe(false);
  });

  // New tests for improved validation (PR review #6)
  it("returns false when documents contains invalid elements (missing title)", () => {
    const config = { documents: [{ content: "no title" }] };
    expect(isTabbedConfig(config)).toBe(false);
  });

  it("returns false when documents contains invalid elements (missing content)", () => {
    const config = { documents: [{ title: "no content" }] };
    expect(isTabbedConfig(config)).toBe(false);
  });

  it("returns false when documents contains null elements", () => {
    const config = { documents: [null] };
    expect(isTabbedConfig(config)).toBe(false);
  });

  it("returns false when documents contains mixed valid and invalid elements", () => {
    const config = {
      documents: [
        { title: "Valid", content: "valid content" },
        { invalid: "element" },
      ],
    };
    expect(isTabbedConfig(config)).toBe(false);
  });

  it("returns true when documents contains all valid elements", () => {
    const config = {
      documents: [
        { title: "Doc 1", content: "Content 1" },
        { title: "Doc 2", content: "Content 2", filePath: "/optional/path" },
      ],
    };
    expect(isTabbedConfig(config)).toBe(true);
  });

  it("returns true for empty documents array", () => {
    const config = { documents: [] };
    expect(isTabbedConfig(config)).toBe(true);
  });
});

describe("normalizeToTabs", () => {
  it("passes through TabbedDocumentConfig unchanged", () => {
    const docs: TabDocument[] = [
      { title: "PRD.md", content: "# PRD", filePath: "/path/PRD.md" },
      { title: "SPEC.md", content: "# Spec", filePath: "/path/SPEC.md" },
    ];
    const config: TabbedDocumentConfig = { documents: docs };
    const result = normalizeToTabs(config);
    expect(result).toEqual(docs);
  });

  it("converts DocumentConfig to single-item array", () => {
    const config: DocumentConfig = {
      content: "# Hello World",
      title: "My Document",
    };
    const result = normalizeToTabs(config);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("My Document");
    expect(result[0].content).toBe("# Hello World");
  });

  it("uses default title when DocumentConfig has no title", () => {
    const config: DocumentConfig = {
      content: "Some content",
    };
    const result = normalizeToTabs(config);
    expect(result[0].title).toBe("Document");
  });

  it("preserves empty documents array", () => {
    const config: TabbedDocumentConfig = { documents: [] };
    const result = normalizeToTabs(config);
    expect(result).toEqual([]);
  });

  it("preserves optional filePath in TabDocument", () => {
    const config: TabbedDocumentConfig = {
      documents: [
        { title: "File", content: "Content", filePath: "/some/path.md" },
      ],
    };
    const result = normalizeToTabs(config);
    expect(result[0].filePath).toBe("/some/path.md");
  });
});

describe("TabDocument interface", () => {
  it("requires title and content", () => {
    const doc: TabDocument = {
      title: "Required Title",
      content: "Required content",
    };
    expect(doc.title).toBe("Required Title");
    expect(doc.content).toBe("Required content");
    expect(doc.filePath).toBeUndefined();
  });

  it("allows optional filePath", () => {
    const doc: TabDocument = {
      title: "With Path",
      content: "Content",
      filePath: "/absolute/path/to/file.md",
    };
    expect(doc.filePath).toBe("/absolute/path/to/file.md");
  });
});

describe("TabbedDocumentConfig interface", () => {
  it("requires documents array", () => {
    const config: TabbedDocumentConfig = {
      documents: [],
    };
    expect(config.documents).toEqual([]);
  });

  it("allows optional activeTab", () => {
    const config: TabbedDocumentConfig = {
      documents: [{ title: "A", content: "a" }],
      activeTab: 0,
    };
    expect(config.activeTab).toBe(0);
  });

  it("allows optional readOnly", () => {
    const config: TabbedDocumentConfig = {
      documents: [{ title: "A", content: "a" }],
      readOnly: true,
    };
    expect(config.readOnly).toBe(true);
  });
});

// Tests for validateActiveTab (PR review #6)
describe("validateActiveTab", () => {
  it("returns 0 for undefined activeTab", () => {
    expect(validateActiveTab(undefined, 3)).toBe(0);
  });

  it("returns the activeTab value when valid", () => {
    expect(validateActiveTab(1, 3)).toBe(1);
    expect(validateActiveTab(2, 3)).toBe(2);
  });

  it("returns 0 for negative activeTab", () => {
    expect(validateActiveTab(-1, 3)).toBe(0);
    expect(validateActiveTab(-100, 5)).toBe(0);
  });

  it("returns last valid index for activeTab >= documentCount", () => {
    expect(validateActiveTab(3, 3)).toBe(2);
    expect(validateActiveTab(10, 3)).toBe(2);
    expect(validateActiveTab(100, 5)).toBe(4);
  });

  it("returns 0 for edge case where documentCount is 0", () => {
    expect(validateActiveTab(0, 0)).toBe(0);
    expect(validateActiveTab(5, 0)).toBe(0);
  });

  it("returns 0 for edge case where documentCount is 1", () => {
    expect(validateActiveTab(0, 1)).toBe(0);
    expect(validateActiveTab(1, 1)).toBe(0);
    expect(validateActiveTab(5, 1)).toBe(0);
  });

  it("handles first valid index correctly", () => {
    expect(validateActiveTab(0, 5)).toBe(0);
  });

  it("handles last valid index correctly", () => {
    expect(validateActiveTab(4, 5)).toBe(4);
  });
});
