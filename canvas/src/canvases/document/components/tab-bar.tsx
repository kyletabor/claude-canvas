// Tab Bar Component - Horizontal tabs for document selection

import React from "react";
import { Box, Text } from "ink";
import { type TabDocument } from "../types";

interface Props {
  tabs: TabDocument[];
  activeIndex: number;
  focused: boolean;
}

export function TabBar({ tabs, activeIndex, focused }: Props) {
  if (tabs.length <= 1) {
    // No tab bar for single document
    return null;
  }

  return (
    <Box flexDirection="row" marginBottom={1}>
      {tabs.map((tab, i) => {
        const isSelected = i === activeIndex;
        const tabNumber = i + 1;
        // Only show shortcuts for tabs 1-9
        const shortcut = tabNumber <= 9 ? `⌥${tabNumber}:` : "";

        const bgColor = isSelected && focused ? "cyan" : isSelected ? "gray" : undefined;
        const textColor = isSelected ? "black" : "gray";

        return (
          <Box key={`${tab.title}-${i}`} marginRight={1}>
            <Text backgroundColor={bgColor} color={textColor} bold={isSelected}>
              {` ${shortcut}${tab.title} `}
            </Text>
          </Box>
        );
      })}
      <Box flexGrow={1} />
      <Text color="gray" dimColor>
        Alt+N to switch
      </Text>
    </Box>
  );
}
