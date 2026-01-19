// Document Canvas - Markdown editor with syntax highlighting

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Text, useInput, useApp, useStdout, useStdin } from "ink";
import { useIPCServer } from "./calendar/hooks/use-ipc-server";
import { useMouse } from "./calendar/hooks/use-mouse";
import { RawMarkdownRenderer, TabBar, Scrollbar } from "./document/components";
import { EmailHeader } from "./document/components/email-header";
import type { DocumentConfig, EmailConfig, TabDocument, TabbedDocumentConfig } from "./document/types";
import { normalizeToTabs, isTabbedConfig } from "./document/types";

interface Props {
  id: string;
  config?: DocumentConfig | TabbedDocumentConfig;
  socketPath?: string;
  scenario?: string;
}

export function Document({ id, config: initialConfig, socketPath, scenario = "display" }: Props) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const { isRawModeSupported } = useStdin();

  // Terminal dimensions
  const [dimensions, setDimensions] = useState({
    width: stdout?.columns || 120,
    height: stdout?.rows || 40,
  });

  // Scroll state
  const [scrollOffset, setScrollOffset] = useState(0);

  // Tab state - for multi-document support
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  // Use ref for scroll offsets to avoid stale closure issues (M1 mitigation)
  const scrollOffsetsRef = useRef<Map<number, number>>(new Map());

  // Cursor position (character offset in content)
  const [cursorPosition, setCursorPosition] = useState(0);

  // Selection state (null means no selection, just cursor)
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);

  // Mouse dragging state
  const isDraggingRef = useRef(false);

  // Live config state (can be updated via IPC)
  const [liveConfig, setLiveConfig] = useState<DocumentConfig | TabbedDocumentConfig | undefined>(initialConfig);

  // Normalize config to documents array (always ensure at least one document)
  const rawDocuments = liveConfig ? normalizeToTabs(liveConfig) : [];
  const documents: TabDocument[] = rawDocuments.length > 0
    ? rawDocuments
    : [{ title: "Document", content: "# Welcome\n\nNo content provided." }];
  const hasMultipleTabs = documents.length > 1;

  // Switch tab callback (M1 mitigation - atomic operation)
  const switchTab = useCallback((targetTab: number) => {
    if (targetTab < 0 || targetTab >= documents.length) return;
    if (targetTab === activeTabIndex) return;

    // Save current scroll position FIRST (atomic with switch)
    scrollOffsetsRef.current.set(activeTabIndex, scrollOffset);

    // Switch to target tab
    setActiveTabIndex(targetTab);

    // Restore target tab's scroll position (with fallback to 0)
    const savedScroll = scrollOffsetsRef.current.get(targetTab) ?? 0;
    setScrollOffset(savedScroll);

    // Reset cursor position for new tab
    setCursorPosition(0);
    setSelectionStart(null);
    setSelectionEnd(null);
  }, [activeTabIndex, scrollOffset, documents.length]);

  // Get active document content
  const activeDocument = documents[activeTabIndex] || documents[0];
  const activeTitle = activeDocument?.title || "Document";

  // IPC for communicating with Claude (server mode for CLI)
  const ipc = useIPCServer({
    socketPath,
    scenario: scenario || "display",
    onClose: () => exit(),
    onUpdate: (newConfig) => {
      setLiveConfig(newConfig as DocumentConfig | TabbedDocumentConfig);
    },
    onGetSelection: () => {
      if (selectionStart === null || selectionEnd === null) return null;
      const start = Math.min(selectionStart, selectionEnd);
      const end = Math.max(selectionStart, selectionEnd);
      if (start === end) return null;
      return {
        selectedText: content.slice(start, end),
        startOffset: start,
        endOffset: end,
      };
    },
    onGetContent: () => ({
      content,
      cursorPosition,
    }),
  });

  // Check if this is an email preview scenario
  const isEmailPreview = scenario === "email-preview";

  // Config with defaults - use active document's content
  const initialContent = activeDocument?.content || "# Welcome\n\nNo content provided.";
  const title = activeTitle;
  // readOnly: from config, or default based on scenario
  const readOnly = (liveConfig as DocumentConfig | TabbedDocumentConfig | undefined)?.readOnly ?? (scenario === "display" || isEmailPreview);

  // Email-specific fields (only used in email-preview scenario)
  const emailConfig = liveConfig as EmailConfig | undefined;
  const emailFrom = emailConfig?.from || "";
  const emailTo = emailConfig?.to || [];
  const emailCc = emailConfig?.cc;
  const emailBcc = emailConfig?.bcc;
  const emailSubject = emailConfig?.subject || "";

  // Editable content state
  const [content, setContent] = useState(initialContent);

  // Sync content when liveConfig or active tab changes
  useEffect(() => {
    const newContent = activeDocument?.content || "# Welcome\n\nNo content provided.";
    setContent(newContent);
  }, [activeDocument?.content, activeTabIndex]);

  // Listen for terminal resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: stdout?.columns || 120,
        height: stdout?.rows || 40,
      });
    };
    stdout?.on("resize", updateDimensions);
    updateDimensions();
    return () => {
      stdout?.off("resize", updateDimensions);
    };
  }, [stdout]);

  // Calculate layout
  const termWidth = dimensions.width;
  const termHeight = dimensions.height;
  const maxDocWidth = 80;
  // Reserve 3 chars for scrollbar (1 char + 2 margin)
  const docWidth = Math.min(termWidth - 8 - 3, maxDocWidth);
  const headerHeight = 3;
  const footerHeight = 2;
  // Tab bar takes 2 lines when multiple tabs present (1 for tabs + 1 marginBottom)
  const tabBarHeight = hasMultipleTabs ? 2 : 0;
  // Email header takes extra lines: from, to, cc (optional), bcc (optional), subject, separator
  const emailHeaderLines = isEmailPreview
    ? 3 + (emailCc && emailCc.length > 0 ? 1 : 0) + (emailBcc && emailBcc.length > 0 ? 1 : 0) + 2
    : 0;
  const viewportHeight = termHeight - headerHeight - footerHeight - emailHeaderLines - tabBarHeight - 2;

  // Line count and max scroll
  const totalLines = content.split("\n").length;
  const maxScroll = Math.max(0, totalLines - viewportHeight);

  // Calculate content area offset for mouse coordinates
  const leftPadding = Math.max(0, Math.floor((termWidth - docWidth) / 2));
  const contentStartCol = leftPadding + 1 + 2 + 1; // border + paddingX + 1 adjustment
  const contentStartRow = headerHeight + 1 + 1; // title + marginBottom + border + padding

  // Helper: convert terminal coordinates to content offset
  const terminalToOffset = useCallback((termX: number, termY: number): number => {
    const lines = content.split("\n");

    // Adjust for content area offset and scroll
    const col = termX - contentStartCol;
    const row = termY - contentStartRow + scrollOffset;

    // Clamp row to valid range
    const clampedRow = Math.max(0, Math.min(row, lines.length - 1));

    // Calculate character offset
    let offset = 0;
    for (let i = 0; i < clampedRow; i++) {
      offset += lines[i].length + 1; // +1 for newline
    }

    // Add column offset, clamped to line length
    const lineLength = lines[clampedRow]?.length || 0;
    offset += Math.max(0, Math.min(col, lineLength));

    return Math.min(offset, content.length);
  }, [content, contentStartCol, contentStartRow, scrollOffset]);

  // Mouse handlers
  const handleMouseClick = useCallback((event: { x: number; y: number }) => {
    if (readOnly) return;

    const offset = terminalToOffset(event.x, event.y);
    setCursorPosition(offset);
    setSelectionStart(offset);
    setSelectionEnd(null);
    isDraggingRef.current = true;
  }, [readOnly, terminalToOffset]);

  const handleMouseMove = useCallback((event: { x: number; y: number }) => {
    if (readOnly || !isDraggingRef.current) return;

    const offset = terminalToOffset(event.x, event.y);
    setSelectionEnd(offset);
    setCursorPosition(offset);
  }, [readOnly, terminalToOffset]);

  const handleMouseRelease = useCallback(() => {
    isDraggingRef.current = false;
    // If selection start equals end, clear selection (just a click)
    if (selectionStart !== null && selectionEnd !== null && selectionStart === selectionEnd) {
      setSelectionEnd(null);
    }
  }, [selectionStart, selectionEnd]);

  // Use mouse hook
  useMouse({
    enabled: !readOnly,
    onClick: handleMouseClick,
    onMove: handleMouseMove,
    onRelease: handleMouseRelease,
  });

  // Helper: get normalized selection bounds
  const getSelectionBounds = useCallback(() => {
    if (selectionStart === null || selectionEnd === null) return null;
    const start = Math.min(selectionStart, selectionEnd);
    const end = Math.max(selectionStart, selectionEnd);
    if (start === end) return null;
    return { start, end };
  }, [selectionStart, selectionEnd]);

  // Helper: delete selection and return new text with cursor position
  const deleteSelection = useCallback(() => {
    const bounds = getSelectionBounds();
    if (!bounds) return null;

    const newText = content.slice(0, bounds.start) + content.slice(bounds.end);
    return { newText, newCursor: bounds.start };
  }, [content, getSelectionBounds]);

  // Helper: clear selection
  const clearSelection = useCallback(() => {
    setSelectionStart(null);
    setSelectionEnd(null);
  }, []);

  // Helper: get cursor line from position
  const getCursorLine = useCallback((pos: number, text: string) => {
    let line = 0;
    for (let i = 0; i < pos && i < text.length; i++) {
      if (text[i] === "\n") line++;
    }
    return line;
  }, []);

  // Helper: ensure cursor is visible by adjusting scroll
  const ensureCursorVisible = useCallback((pos: number, text: string) => {
    const cursorLine = getCursorLine(pos, text);
    setScrollOffset((offset) => {
      if (cursorLine < offset) return cursorLine;
      if (cursorLine >= offset + viewportHeight) return cursorLine - viewportHeight + 1;
      return offset;
    });
  }, [getCursorLine, viewportHeight]);

  // Keyboard controls
  useInput((input, key) => {
    // Ignore mouse escape sequence fragments that leak through
    // These look like: <, [, digits, ;, M, m, etc. from \x1b[<btn;x;y[Mm]
    if (input && /^[<\[\];Mm\d]+$/.test(input)) {
      return;
    }

    // Quit with Escape
    if (key.escape) {
      // In edit mode with selection, first Escape clears selection
      if (!readOnly && getSelectionBounds()) {
        clearSelection();
        return;
      }
      ipc.sendCancelled("User quit");
      exit();
      return;
    }

    // Alt+number (1-9) for tab switching (M5 mitigation - works in both modes)
    // key.meta is the Alt key in most terminals
    if (key.meta && input && input >= "1" && input <= "9") {
      const targetTab = parseInt(input, 10) - 1;
      if (targetTab < documents.length) {
        switchTab(targetTab);
      }
      return;
    }

    // In read-only mode, only allow scrolling
    if (readOnly) {
      if (key.upArrow) {
        setScrollOffset((o) => Math.max(0, o - 1));
      } else if (key.downArrow) {
        setScrollOffset((o) => Math.min(maxScroll, o + 1));
      } else if (key.pageUp) {
        setScrollOffset((o) => Math.max(0, o - viewportHeight));
      } else if (key.pageDown) {
        setScrollOffset((o) => Math.min(maxScroll, o + viewportHeight));
      }
      return;
    }

    // Edit mode
    const text = content;
    const pos = cursorPosition;
    const selection = getSelectionBounds();

    // Arrow keys - cursor movement (clears selection)
    if (key.leftArrow) {
      const newPos = selection ? selection.start : Math.max(0, pos - 1);
      setCursorPosition(newPos);
      clearSelection();
      ensureCursorVisible(newPos, text);
      return;
    }
    if (key.rightArrow) {
      const newPos = selection ? selection.end : Math.min(text.length, pos + 1);
      setCursorPosition(newPos);
      clearSelection();
      ensureCursorVisible(newPos, text);
      return;
    }
    if (key.upArrow) {
      clearSelection();
      // Move to same column on previous line
      const lines = text.split("\n");
      let currentLine = 0;
      let colInLine = 0;
      for (let i = 0; i < pos; i++) {
        if (text[i] === "\n") {
          currentLine++;
          colInLine = 0;
        } else {
          colInLine++;
        }
      }
      if (currentLine > 0) {
        let newPos = 0;
        for (let l = 0; l < currentLine - 1; l++) {
          newPos += lines[l].length + 1;
        }
        newPos += Math.min(colInLine, lines[currentLine - 1].length);
        setCursorPosition(newPos);
        ensureCursorVisible(newPos, text);
      }
      return;
    }
    if (key.downArrow) {
      clearSelection();
      // Move to same column on next line
      const lines = text.split("\n");
      let currentLine = 0;
      let colInLine = 0;
      for (let i = 0; i < pos; i++) {
        if (text[i] === "\n") {
          currentLine++;
          colInLine = 0;
        } else {
          colInLine++;
        }
      }
      if (currentLine < lines.length - 1) {
        let newPos = 0;
        for (let l = 0; l <= currentLine; l++) {
          newPos += lines[l].length + 1;
        }
        newPos += Math.min(colInLine, lines[currentLine + 1].length);
        setCursorPosition(Math.min(newPos, text.length));
        ensureCursorVisible(Math.min(newPos, text.length), text);
      }
      return;
    }

    // Page up/down for scrolling
    if (key.pageUp) {
      setScrollOffset((o) => Math.max(0, o - viewportHeight));
      return;
    }
    if (key.pageDown) {
      setScrollOffset((o) => Math.min(maxScroll, o + viewportHeight));
      return;
    }

    // Backspace - delete selection or previous char
    if (key.backspace || key.delete) {
      if (selection) {
        // Delete selection
        const result = deleteSelection();
        if (result) {
          setContent(result.newText);
          setCursorPosition(result.newCursor);
          clearSelection();
          ensureCursorVisible(result.newCursor, result.newText);
        }
      } else if (pos > 0) {
        const newText = text.slice(0, pos - 1) + text.slice(pos);
        setContent(newText);
        setCursorPosition(pos - 1);
        ensureCursorVisible(pos - 1, newText);
      }
      return;
    }

    // Enter - replace selection or insert newline
    if (key.return) {
      if (selection) {
        const result = deleteSelection();
        if (result) {
          const newText = result.newText.slice(0, result.newCursor) + "\n" + result.newText.slice(result.newCursor);
          setContent(newText);
          setCursorPosition(result.newCursor + 1);
          clearSelection();
          ensureCursorVisible(result.newCursor + 1, newText);
        }
      } else {
        const newText = text.slice(0, pos) + "\n" + text.slice(pos);
        setContent(newText);
        setCursorPosition(pos + 1);
        ensureCursorVisible(pos + 1, newText);
      }
      return;
    }

    // Regular character input - replace selection or insert
    if (input && !key.ctrl && !key.meta) {
      if (selection) {
        const result = deleteSelection();
        if (result) {
          const newText = result.newText.slice(0, result.newCursor) + input + result.newText.slice(result.newCursor);
          setContent(newText);
          setCursorPosition(result.newCursor + input.length);
          clearSelection();
          ensureCursorVisible(result.newCursor + input.length, newText);
        }
      } else {
        const newText = text.slice(0, pos) + input + text.slice(pos);
        setContent(newText);
        setCursorPosition(pos + input.length);
        ensureCursorVisible(pos + input.length, newText);
      }
      return;
    }
  }, { isActive: !!isRawModeSupported });

  // Scroll indicator
  const scrollPercent = maxScroll > 0 ? Math.round((scrollOffset / maxScroll) * 100) : 100;

  // Calculate cursor line and column for display
  const cursorLine = getCursorLine(cursorPosition, content);
  let cursorCol = 0;
  let charCount = 0;
  for (const line of content.split("\n")) {
    if (charCount + line.length >= cursorPosition) {
      cursorCol = cursorPosition - charCount;
      break;
    }
    charCount += line.length + 1;
  }

  return (
    <Box flexDirection="column" width={termWidth} height={termHeight}>
      {/* Title bar - centered */}
      <Box justifyContent="center" marginBottom={1}>
        <Box width={docWidth + 3}>
          <Text bold color="white">
            {isEmailPreview ? "Email Preview" : (title || "Document")}
          </Text>
          <Box flexGrow={1} />
          <Text color="gray" dimColor>
            {totalLines > viewportHeight ? `${scrollPercent}%` : ""}
          </Text>
        </Box>
      </Box>

      {/* Tab bar when multiple documents */}
      {hasMultipleTabs && (
        <Box justifyContent="center" marginBottom={1}>
          <Box width={docWidth + 3}>
            <TabBar tabs={documents} activeIndex={activeTabIndex} focused={true} />
          </Box>
        </Box>
      )}

      {/* Document with border and scrollbar - centered */}
      <Box justifyContent="center" flexGrow={1}>
        <Box flexDirection="row">
          <Box
            width={docWidth}
            flexDirection="column"
            borderStyle="round"
            borderColor={isEmailPreview ? "blue" : "green"}
            paddingX={2}
            paddingY={1}
          >
            {/* Email header for email-preview scenario */}
            {isEmailPreview && (
              <EmailHeader
                from={emailFrom}
                to={emailTo}
                cc={emailCc}
                bcc={emailBcc}
                subject={emailSubject}
                width={docWidth - 6}
              />
            )}
            <RawMarkdownRenderer
              content={content}
              cursorPosition={readOnly ? undefined : cursorPosition}
              selectionStart={selectionStart}
              selectionEnd={selectionEnd}
              scrollOffset={scrollOffset}
              viewportHeight={viewportHeight}
              terminalWidth={docWidth - 6}
            />
          </Box>
          {/* Scrollbar on right */}
          <Box marginLeft={1}>
            <Scrollbar
              scrollOffset={scrollOffset}
              totalLines={totalLines}
              viewportHeight={viewportHeight}
              height={viewportHeight}
            />
          </Box>
        </Box>
      </Box>

      {/* Status bar - single line, centered */}
      <Box justifyContent="center">
        <Box width={docWidth + 3} justifyContent="space-between">
          <Text color="gray" dimColor>
            {readOnly ? "↑↓ scroll • Esc quit" : "click/drag select • type to edit • Esc quit"}
          </Text>
          <Text color="gray" dimColor>
            {!readOnly && (
              <Text color="cyan">
                Ln {cursorLine + 1}, Col {cursorCol + 1}
                <Text color="gray" dimColor> • </Text>
              </Text>
            )}
            {totalLines > viewportHeight
              ? `${scrollOffset + 1}-${Math.min(scrollOffset + viewportHeight, totalLines)} of ${totalLines}`
              : `${totalLines} lines`}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
