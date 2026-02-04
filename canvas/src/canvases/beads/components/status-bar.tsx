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
}

export function StatusBar({ width, focusMode }: StatusBarProps) {
  // Separator line
  const separator = "━".repeat(width);

  // Build help text based on focus mode
  let helpText: string;
  if (focusMode === "tree") {
    helpText = "←→ epics  ↑↓ navigate  ▸/▼ expand  o open  ? help  q quit";
  } else {
    // detail mode
    helpText = "←→ epics  ↑↓ scroll  Tab tree  ? help  q quit";
  }

  return (
    <Box flexDirection="column">
      <Text color={BEAD_COLORS.header}>{separator}</Text>
      <Text color={BEAD_COLORS.dim}>{helpText}</Text>
    </Box>
  );
}
