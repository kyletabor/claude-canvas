// Document Canvas Types

// Document canvas configuration (from Claude)
export interface DocumentConfig {
  content: string;           // Markdown content
  title?: string;            // Optional document title
  diffs?: DocumentDiff[];    // Optional diff markers for highlighting
  readOnly?: boolean;        // Disable selection (default false)
}

// Individual tab/document in tabbed view
export interface TabDocument {
  title: string;             // Display name (usually filename)
  content: string;           // Markdown content
  filePath?: string;         // Original file path (for reference)
}

// Tabbed document configuration (multiple documents)
export interface TabbedDocumentConfig {
  documents: TabDocument[];  // Array of documents to display as tabs
  activeTab?: number;        // Initially active tab index (default 0)
  readOnly?: boolean;        // Applies to all tabs
}

// Helper: validate a single TabDocument has required fields
function isValidTabDocument(doc: unknown): doc is TabDocument {
  return (
    typeof doc === "object" &&
    doc !== null &&
    typeof (doc as TabDocument).title === "string" &&
    typeof (doc as TabDocument).content === "string"
  );
}

// Type guard: check if config is tabbed format with valid documents
export function isTabbedConfig(config: unknown): config is TabbedDocumentConfig {
  if (typeof config !== "object" || config === null) return false;
  if (!("documents" in config)) return false;
  const docs = (config as { documents: unknown }).documents;
  if (!Array.isArray(docs)) return false;
  // Validate each element has required fields (title and content strings)
  return docs.every(isValidTabDocument);
}

// Normalizer: always convert to TabDocument array
export function normalizeToTabs(config: DocumentConfig | TabbedDocumentConfig): TabDocument[] {
  if (isTabbedConfig(config)) {
    return config.documents;
  }
  // Convert single DocumentConfig to TabDocument
  return [{ title: config.title ?? "Document", content: config.content }];
}

// Validate activeTab bounds and return a safe value
export function validateActiveTab(activeTab: number | undefined, documentCount: number): number {
  if (activeTab === undefined) return 0;
  if (documentCount <= 0) return 0;
  if (activeTab < 0) return 0;
  if (activeTab >= documentCount) return Math.max(0, documentCount - 1);
  return activeTab;
}

// Email preview configuration (extends document for email-preview scenario)
export interface EmailConfig extends DocumentConfig {
  from: string;              // Sender email/name
  to: string[];              // Recipients
  cc?: string[];             // CC recipients
  bcc?: string[];            // BCC recipients
  subject: string;           // Email subject line
}

// Diff marker for highlighting changes
export interface DocumentDiff {
  startOffset: number;       // Character offset in content
  endOffset: number;         // End character offset
  type: "add" | "delete";    // Type of change
}

// Selection result (sent to Claude via IPC)
export interface DocumentSelection {
  selectedText: string;      // The selected text content
  startOffset: number;       // Start character offset in content
  endOffset: number;         // End character offset
  startLine: number;         // Line number (1-based)
  endLine: number;           // End line number
  startColumn: number;       // Column in start line
  endColumn: number;         // Column in end line
}

// Internal: A styled segment within a line
export interface LineSegment {
  text: string;              // Display text
  sourceOffset: number;      // Offset within the source content
  sourceLength: number;      // Length in source (may differ from display)
  style: SegmentStyle;       // Styling for this segment
}

// Styling for segments
export interface SegmentStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
  backgroundColor?: string;
  dimColor?: boolean;
  // Markdown element type for styling
  type?: "h1" | "h2" | "h3" | "h4" | "bold" | "italic" | "code" |
         "codeBlock" | "link" | "listItem" | "blockquote" | "body";
}

// Internal: Rendered line with offset tracking
export interface RenderedLine {
  lineNumber: number;        // 1-based line number in source
  sourceOffset: number;      // Character offset where this line starts in source
  sourceLength: number;      // Number of source characters this line represents
  segments: LineSegment[];   // Styled segments for rendering
  indent: number;            // Left indentation (for lists, blockquotes)
  isBlank: boolean;          // True if this is a blank line
}

// Mapping: terminal position to source offset
export interface PositionMapping {
  terminalRow: number;       // 1-based terminal row
  terminalCol: number;       // 1-based terminal column
  sourceOffset: number;      // Character offset in source
}

// Selection state (internal)
export interface SelectionState {
  isSelecting: boolean;
  anchorOffset: number | null;    // Where selection started
  focusOffset: number | null;     // Where selection currently ends
  // Normalized (always start <= end)
  startOffset: number | null;
  endOffset: number | null;
}

// Markdown style definitions
export const MARKDOWN_STYLES: Record<string, Partial<SegmentStyle>> = {
  h1: { bold: true, color: "white", type: "h1" },
  h2: { bold: true, color: "white", type: "h2" },
  h3: { bold: true, color: "cyan", type: "h3" },
  h4: { color: "cyan", type: "h4" },
  bold: { bold: true, type: "bold" },
  italic: { italic: true, type: "italic" },
  code: { color: "yellow", type: "code" },
  codeBlock: { color: "gray", type: "codeBlock" },
  link: { color: "blue", underline: true, type: "link" },
  listItem: { type: "listItem" },
  blockquote: { color: "gray", dimColor: true, type: "blockquote" },
  body: { type: "body" },
};

// Diff style colors
export const DIFF_STYLES = {
  add: { backgroundColor: "green" },
  delete: { backgroundColor: "red", strikethrough: true },
};

// Selection style
export const SELECTION_STYLE = {
  backgroundColor: "blue",
};
