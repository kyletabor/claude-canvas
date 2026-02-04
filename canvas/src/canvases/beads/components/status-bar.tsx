/**
 * StatusBar component for the Beads Canvas.
 * Shows keyboard shortcuts and help text based on current focus mode.
 */

import React from "react";
import { Box, Text } from "ink";
import { BEAD_COLORS } from "../types";

export type FocusMode = "tree" | "detail";

export interface StatusBarProps {
  /** Width of the canvas */
  width: number;
  /** Current focus mode */
  focusMode: FocusMode;
  /** Connection error message to display */
  connectionError?: string | null;
}

/**
 * Renders the status bar with keyboard shortcuts and connection status.
 */
export function StatusBar({ width, focusMode, connectionError }: StatusBarProps) {
  // Separator line
  const separator = "━".repeat(Math.max(0, width));

  // Build help text based on focus mode
  let helpText: string;
  if (focusMode === "tree") {
    helpText = "←→ epics  ↑↓ navigate  ▸/▼ expand  o open  q quit";
  } else {
    // detail mode
    helpText = "←→ epics  ↑↓ scroll  Tab tree  q quit";
  }

  return (
    <Box flexDirection="column">
      <Text color={BEAD_COLORS.header}>{separator}</Text>
      {connectionError ? (
        <Text color="red" bold>⚠ {connectionError}</Text>
      ) : (
        <Text color={BEAD_COLORS.dim}>{helpText}</Text>
      )}
    </Box>
  );
}
