// Scrollbar Component - Vertical position indicator for document

import React from "react";
import { Box, Text } from "ink";

interface Props {
  scrollOffset: number;     // Current scroll position (line number)
  totalLines: number;       // Total lines in document
  viewportHeight: number;   // Visible lines in viewport
  height: number;           // Height of scrollbar track
}

export function Scrollbar({ scrollOffset, totalLines, viewportHeight, height }: Props) {
  // Don't show scrollbar if content fits in viewport
  if (totalLines <= viewportHeight) {
    return (
      <Box flexDirection="column" width={1}>
        {Array.from({ length: height }).map((_, i) => (
          <Text key={i} color="gray" dimColor>
            {" "}
          </Text>
        ))}
      </Box>
    );
  }

  // Calculate thumb size (minimum 1 character)
  const thumbSize = Math.max(1, Math.floor((viewportHeight / totalLines) * height));

  // Calculate thumb position with proper clamping
  const scrollableLines = Math.max(1, totalLines - viewportHeight);
  const trackSpace = height - thumbSize;
  const thumbPosition = Math.floor((scrollOffset / scrollableLines) * trackSpace);
  const clampedPosition = Math.min(Math.max(0, thumbPosition), trackSpace);

  // Build scrollbar characters
  const scrollbarChars: string[] = [];
  for (let i = 0; i < height; i++) {
    if (i >= clampedPosition && i < clampedPosition + thumbSize) {
      scrollbarChars.push("█");
    } else {
      scrollbarChars.push("░");
    }
  }

  return (
    <Box flexDirection="column" width={1}>
      {scrollbarChars.map((char, i) => (
        <Text key={i} color={char === "█" ? "cyan" : "gray"} dimColor={char !== "█"}>
          {char}
        </Text>
      ))}
    </Box>
  );
}
