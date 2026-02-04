/**
 * Hook for keyboard navigation in the Beads tree canvas.
 * Handles selection, scrolling, expand/collapse, and various action callbacks.
 */

import { useState, useEffect } from 'react';
import { useInput, useStdin } from 'ink';
import type { FlattenedNode } from '../types';

/**
 * Options for configuring tree navigation behavior.
 */
export interface UseTreeNavigationOptions {
  /** Flattened tree nodes to navigate */
  flattenedNodes: FlattenedNode[];
  /** Number of visible rows in the viewport */
  viewportHeight: number;
  /** Callback when toggling expand/collapse on a node */
  onToggle: (beadId: string) => void;
  /** Callback when requesting details for a node */
  onDetails: (beadId: string) => void;
  /** Callback to refresh the tree */
  onRefresh: () => void;
  /** Callback for epic navigation (prev/next) */
  onEpicNav: (direction: 'prev' | 'next') => void;
  /** Callback to quit the canvas */
  onQuit: () => void;
}

/**
 * Result from the tree navigation hook.
 */
export interface UseTreeNavigationResult {
  /** Currently selected node index in the flattened list */
  selectedIndex: number;
  /** Scroll offset (first visible row index) */
  scrollOffset: number;
}

/**
 * Clamps a value to the given range [min, max].
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Hook for keyboard navigation in a tree structure.
 *
 * Handles:
 * - Arrow keys for navigation (up/down/left/right)
 * - PageUp/PageDown for fast scrolling
 * - Enter to toggle expand/collapse
 * - 'o' to open details
 * - 'r' to refresh
 * - 'q' or Escape to quit
 */
export function useTreeNavigation(
  options: UseTreeNavigationOptions
): UseTreeNavigationResult {
  const {
    flattenedNodes,
    viewportHeight,
    onToggle,
    onDetails,
    onRefresh,
    onEpicNav,
    onQuit,
  } = options;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const { isRawModeSupported } = useStdin();

  const nodeCount = flattenedNodes.length;
  const maxIndex = Math.max(0, nodeCount - 1);

  // Reset selection when nodes change significantly
  useEffect(() => {
    if (selectedIndex > maxIndex) {
      setSelectedIndex(maxIndex);
    }
  }, [nodeCount, selectedIndex, maxIndex]);

  // Auto-scroll to keep selection visible
  useEffect(() => {
    if (nodeCount === 0) return;

    // If selection is above visible area, scroll up
    if (selectedIndex < scrollOffset) {
      setScrollOffset(selectedIndex);
    }
    // If selection is below visible area, scroll down
    else if (selectedIndex >= scrollOffset + viewportHeight) {
      setScrollOffset(selectedIndex - viewportHeight + 1);
    }
  }, [selectedIndex, scrollOffset, viewportHeight, nodeCount]);

  // Keyboard input handling
  useInput(
    (input, key) => {
      // Don't process input if no nodes
      if (nodeCount === 0) {
        // Still allow quit and refresh
        if (input === 'q' || key.escape) {
          onQuit();
        } else if (input === 'r') {
          onRefresh();
        }
        return;
      }

      // Quit
      if (input === 'q' || key.escape) {
        onQuit();
        return;
      }

      // Refresh
      if (input === 'r') {
        onRefresh();
        return;
      }

      // Epic navigation (left/right arrows)
      if (key.leftArrow) {
        onEpicNav('prev');
        return;
      }
      if (key.rightArrow) {
        onEpicNav('next');
        return;
      }

      // Vertical navigation
      if (key.upArrow) {
        setSelectedIndex((prev) => clamp(prev - 1, 0, maxIndex));
        return;
      }
      if (key.downArrow) {
        setSelectedIndex((prev) => clamp(prev + 1, 0, maxIndex));
        return;
      }

      // Page navigation
      if (key.pageUp) {
        setSelectedIndex((prev) => clamp(prev - viewportHeight, 0, maxIndex));
        return;
      }
      if (key.pageDown) {
        setSelectedIndex((prev) => clamp(prev + viewportHeight, 0, maxIndex));
        return;
      }

      // Toggle expand/collapse
      if (key.return) {
        const selectedNode = flattenedNodes[selectedIndex];
        if (selectedNode?.hasChildren) {
          onToggle(selectedNode.node.id);
        }
        return;
      }

      // Open details
      if (input === 'o') {
        const selectedNode = flattenedNodes[selectedIndex];
        if (selectedNode) {
          onDetails(selectedNode.node.id);
        }
        return;
      }
    },
    { isActive: !!isRawModeSupported }
  );

  return {
    selectedIndex,
    scrollOffset,
  };
}
