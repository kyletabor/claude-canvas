/**
 * BeadTree component and utility functions for the Beads Canvas tree rendering.
 * Provides tree flattening, prefix generation, and the main tree view component.
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { BeadNode, FlattenedNode } from '../types';
import { TREE_CHARS, BEAD_COLORS } from '../types';
import { BeadRow } from './bead-row';

/** Maximum depth to prevent stack overflow on deeply nested/circular trees */
const MAX_DEPTH = 50;

/**
 * Flattens a hierarchical BeadNode tree into a list for rendering.
 * Handles circular references and depth limits for safety.
 *
 * @param nodes - Root nodes to flatten
 * @param expandedIds - Set of node IDs that are currently expanded
 * @param depth - Current depth level (internal use)
 * @param parentPath - Array tracking which ancestors are last siblings (internal use)
 * @param visited - Set of visited node IDs for circular reference detection (internal use)
 * @returns Flat list of nodes with rendering metadata
 */
export function flattenTree(
  nodes: BeadNode[],
  expandedIds: Set<string>,
  depth = 0,
  parentPath: boolean[] = [],
  visited = new Set<string>()
): FlattenedNode[] {
  // Edge case: empty or undefined nodes
  if (!nodes || nodes.length === 0) {
    return [];
  }

  // Depth limit check
  if (depth > MAX_DEPTH) {
    console.warn(`flattenTree: Maximum depth (${MAX_DEPTH}) exceeded, truncating`);
    return [];
  }

  const result: FlattenedNode[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!node) continue;

    // Circular reference protection
    if (visited.has(node.id)) {
      console.warn(`flattenTree: Circular reference detected for node '${node.id}', skipping`);
      continue;
    }

    // Track this node as visited
    const newVisited = new Set(visited);
    newVisited.add(node.id);

    const isLast = i === nodes.length - 1;
    const children = node.children ?? [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(node.id);

    // Add the current node
    result.push({
      node,
      depth,
      isLast,
      isExpanded,
      hasChildren,
      parentPath: [...parentPath],
      flatIndex: result.length,
    });

    // Recursively flatten children if expanded
    if (hasChildren && isExpanded) {
      const childPath = [...parentPath, isLast];
      const flattenedChildren = flattenTree(
        children,
        expandedIds,
        depth + 1,
        childPath,
        newVisited
      );

      // Update flatIndex for children
      for (const child of flattenedChildren) {
        child.flatIndex = result.length;
        result.push(child);
      }
    }
  }

  return result;
}

/**
 * Generates the tree prefix string for a flattened node.
 * Creates the visual tree structure using box-drawing characters.
 *
 * @param flat - The flattened node to generate prefix for
 * @returns String containing tree structure characters and expand indicator
 *
 * @example
 * // Root node with children (expanded)
 * getTreePrefix({ depth: 0, hasChildren: true, isExpanded: true, ... }) // "▼ "
 *
 * // Child node (last sibling, no children)
 * getTreePrefix({ depth: 1, isLast: true, hasChildren: false, ... }) // "└── "
 *
 * // Nested node with siblings above
 * getTreePrefix({ depth: 2, isLast: false, hasChildren: true, isExpanded: false, parentPath: [false] })
 * // "│   ├──▸ "
 */
export function getTreePrefix(flat: FlattenedNode): string {
  const parts: string[] = [];

  // Build vertical pipes for parent path
  for (const parentIsLast of flat.parentPath) {
    if (parentIsLast) {
      // Parent was last sibling, no continuing line
      parts.push('    ');
    } else {
      // Parent has siblings below, show continuing line
      parts.push(TREE_CHARS.PIPE + '   ');
    }
  }

  // Add branch connector (except for root level)
  if (flat.depth > 0) {
    const branchChar = flat.isLast ? TREE_CHARS.LAST : TREE_CHARS.BRANCH;
    parts.push(branchChar + TREE_CHARS.HORIZONTAL);
  }

  // Add expand indicator if has children
  if (flat.hasChildren) {
    parts.push(flat.isExpanded ? TREE_CHARS.EXPANDED : TREE_CHARS.COLLAPSED);
    parts.push(' ');
  }

  return parts.join('');
}

/**
 * Props for the BeadTree component.
 */
export interface BeadTreeProps {
  /** Flattened nodes to display */
  nodes: FlattenedNode[];
  /** Index of currently selected node */
  selectedIndex: number;
  /** Index of first visible node (for scrolling) */
  scrollOffset: number;
  /** Number of rows visible in viewport */
  viewportHeight: number;
  /** Available width for rendering */
  width: number;
}

/**
 * BeadTree component - Renders the full tree using BeadRow components.
 * Handles windowed rendering for scrolling and shows scroll indicators.
 */
export function BeadTree({
  nodes,
  selectedIndex,
  scrollOffset,
  viewportHeight,
  width,
}: BeadTreeProps): React.JSX.Element {
  // Handle empty state
  if (!nodes || nodes.length === 0) {
    return (
      <Box flexDirection="column" height={viewportHeight} justifyContent="center" alignItems="center">
        <Text color={BEAD_COLORS.dim}>No beads to display</Text>
      </Box>
    );
  }

  // Calculate visible range
  const visibleNodes = nodes.slice(scrollOffset, scrollOffset + viewportHeight);

  // Calculate scroll indicators
  const itemsAbove = scrollOffset;
  const itemsBelow = Math.max(0, nodes.length - scrollOffset - viewportHeight);

  // Calculate height for content (accounting for scroll indicators)
  const hasTopIndicator = itemsAbove > 0;
  const hasBottomIndicator = itemsBelow > 0;
  const contentHeight = viewportHeight - (hasTopIndicator ? 1 : 0) - (hasBottomIndicator ? 1 : 0);

  return (
    <Box flexDirection="column" height={viewportHeight}>
      {/* Top scroll indicator */}
      {hasTopIndicator && (
        <Text color={BEAD_COLORS.dim}>↑ {itemsAbove} more</Text>
      )}

      {/* Visible nodes */}
      <Box flexDirection="column" height={contentHeight}>
        {visibleNodes.slice(0, contentHeight).map((flat) => (
          <BeadRow
            key={flat.node.id}
            flat={flat}
            isSelected={flat.flatIndex === selectedIndex}
            width={width}
          />
        ))}
      </Box>

      {/* Bottom scroll indicator */}
      {hasBottomIndicator && (
        <Text color={BEAD_COLORS.dim}>↓ {itemsBelow} more</Text>
      )}
    </Box>
  );
}
