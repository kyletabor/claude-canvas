/**
 * HeaderBar component for the Beads Canvas.
 * Shows navigation affordances and current position in epic hierarchy.
 */

import React from "react";
import { Box, Text } from "ink";
import { BEAD_COLORS } from "../types";

export interface HeaderBarProps {
  /** Optional title (e.g., current bead ID) */
  title?: string;
  /** Current epic index (1-based) */
  epicIndex: number;
  /** Total number of epics */
  totalEpics: number;
  /** Width of the canvas */
  width: number;
}

export function HeaderBar({ title, epicIndex, totalEpics, width }: HeaderBarProps) {
  const leftText = `← epics (${totalEpics})`;
  const rightText = title ? `${title}  ${epicIndex}/${totalEpics}` : `${epicIndex}/${totalEpics}`;

  // Calculate padding to right-align the right text
  const contentWidth = leftText.length + rightText.length;
  const padding = Math.max(0, width - contentWidth);

  // Separator line
  const separator = "━".repeat(width);

  return (
    <Box flexDirection="column">
      <Box justifyContent="space-between" width={width}>
        <Text color={BEAD_COLORS.header}>{leftText}</Text>
        <Text color={BEAD_COLORS.header}>{rightText}</Text>
      </Box>
      <Text color={BEAD_COLORS.header}>{separator}</Text>
    </Box>
  );
}
