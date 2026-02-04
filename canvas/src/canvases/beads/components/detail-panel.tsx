/**
 * Detail Panel Component - Shows full bead information in a bordered panel.
 */

import React from "react";
import { Box, Text, useInput } from "ink";
import {
  type BeadNode,
  BEAD_COLORS,
  STATUS_ICONS,
  UNKNOWN_STATUS_ICON,
} from "../types";

interface DetailPanelProps {
  node: BeadNode;
  onClose: () => void;
  width: number;
  height: number;
  isActive?: boolean;
}

/**
 * Renders a detailed view of a bead node with all its metadata.
 */
export function DetailPanel({
  node,
  onClose,
  width,
  height,
  isActive = true,
}: DetailPanelProps): React.JSX.Element {
  // Handle keyboard input - Escape closes the panel
  useInput(
    (_input, key) => {
      if (key.escape) {
        onClose();
      }
    },
    { isActive }
  );

  const statusIcon = STATUS_ICONS[node.status] ?? UNKNOWN_STATUS_ICON;
  const hasBlockers = node.blockedBy && node.blockedBy.length > 0;

  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      borderStyle="single"
      borderColor={BEAD_COLORS.header}
      paddingX={1}
    >
      {/* Header Section */}
      <Box flexDirection="column">
        <Text bold color={BEAD_COLORS.header}>
          {node.id}
        </Text>
        <Text color={BEAD_COLORS.normal}>{node.title}</Text>
      </Box>

      {/* Divider */}
      <Box marginY={1}>
        <Text color={BEAD_COLORS.dim}>{"─".repeat(Math.max(0, width - 4))}</Text>
      </Box>

      {/* Info Section */}
      <Box flexDirection="column">
        <Text>
          <Text color={BEAD_COLORS.dim}>Status: </Text>
          <Text>{statusIcon} </Text>
          <Text color={BEAD_COLORS.normal}>
            {node.status.charAt(0).toUpperCase() + node.status.slice(1).replaceAll("_", " ")}
          </Text>
        </Text>
        <Text>
          <Text color={BEAD_COLORS.dim}>Priority: </Text>
          <Text color={BEAD_COLORS.priority}>P{node.priority}</Text>
        </Text>
        {node.assignee && (
          <Text>
            <Text color={BEAD_COLORS.dim}>Assignee: </Text>
            <Text color={BEAD_COLORS.normal}>@{node.assignee}</Text>
          </Text>
        )}
      </Box>

      {/* Blockers Section - only if there are blockers */}
      {hasBlockers && (
        <>
          <Box marginY={1}>
            <Text color={BEAD_COLORS.dim}>{"─".repeat(Math.max(0, width - 4))}</Text>
          </Box>
          <Box flexDirection="column">
            <Text color={BEAD_COLORS.blocker}>Blocked By:</Text>
            {node.blockedBy!.map((blockerId) => (
              <Text key={blockerId} color={BEAD_COLORS.dim}>
                {"  • "}{blockerId}
              </Text>
            ))}
          </Box>
        </>
      )}

      {/* Spacer to push footer to bottom */}
      <Box flexGrow={1} />

      {/* Footer */}
      <Box marginY={1}>
        <Text color={BEAD_COLORS.dim}>{"─".repeat(Math.max(0, width - 4))}</Text>
      </Box>
      <Box>
        <Text color={BEAD_COLORS.dim}>[Press Esc to close]</Text>
      </Box>
    </Box>
  );
}
