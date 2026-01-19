// Tests for document tab functionality

import { describe, it, expect } from "bun:test";
import {
  TabDocument,
  TabbedDocumentConfig,
  isTabbedConfig,
  normalizeToTabs,
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
