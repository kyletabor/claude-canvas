/**
 * BeadRow component - Renders a single row in the bead tree.
 * Handles tree prefix, status icon, ID, title truncation, and selection highlighting.
 */

import React from "react";
import { Box, Text } from "ink";
import type { FlattenedNode } from "../types";
import {
  BEAD_COLORS,
  STATUS_ICONS,
  UNKNOWN_STATUS_ICON,
} from "../types";
import { getTreePrefix } from "./bead-tree";

export interface BeadRowProps {
  /** Flattened node with tree metadata */
  flat: FlattenedNode;
  /** Whether this row is currently selected */
  isSelected: boolean;
  /** Available width for the row */
  width: number;
}

/**
 * Truncates a string to fit within maxLength, adding ellipsis if needed.
 */
function truncate(text: string, maxLength: number): string {
  if (maxLength <= 0) return "";
  if (text.length <= maxLength) return text;
  if (maxLength <= 1) return "…";
  return text.slice(0, maxLength - 1) + "…";
}

/**
 * Renders a single row in the bead tree.
 */
export function BeadRow({ flat, isSelected, width }: BeadRowProps): React.JSX.Element {
  const { node } = flat;

  // Get tree prefix (box-drawing characters and expand indicator)
  const prefix = getTreePrefix(flat);

  // Get status icon with fallback
  const statusIcon = STATUS_ICONS[node.status] ?? UNKNOWN_STATUS_ICON;

  // Format blocker indicator (only for blocked status with actual blockers)
  const hasBlocker = node.status === "blocked" && node.blockedBy && node.blockedBy.length > 0;
  const blockerText = hasBlocker ? ` [→${node.blockedBy![0]}]` : "";

  // Calculate available width for title
  // prefix + icon (2 chars with space) + id + "  " + title + blockerText
  const prefixLen = prefix.length;
  const iconLen = 2; // emoji + space
  const idLen = node.id.length;
  const spacerLen = 2; // "  " between id and title
  const blockerLen = blockerText.length;

  // Minimum space for title truncation
  const usedWidth = prefixLen + iconLen + idLen + spacerLen + blockerLen;
  const availableForTitle = Math.max(0, width - usedWidth);

  // Truncate title if needed
  const displayTitle = truncate(node.title, availableForTitle);

  // Base color based on selection
  const textColor = isSelected ? BEAD_COLORS.selected : BEAD_COLORS.normal;

  return (
    <Box>
      <Text inverse={isSelected}>
        {/* Tree prefix (dimmed) */}
        <Text color={BEAD_COLORS.dim}>{prefix}</Text>
        {/* Status icon */}
        <Text>{statusIcon} </Text>
        {/* Bead ID (dimmed) */}
        <Text color={BEAD_COLORS.dim}>{node.id}</Text>
        {/* Spacer */}
        <Text>  </Text>
        {/* Title */}
        <Text color={textColor}>{displayTitle}</Text>
        {/* Blocker indicator (red, only if blocked) */}
        {hasBlocker && (
          <Text color={BEAD_COLORS.blocker}>{blockerText}</Text>
        )}
      </Text>
    </Box>
  );
}
