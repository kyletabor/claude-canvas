// Beads Canvas - Tree Rendering Component

import React from "react";
import { Box, Text } from "ink";
import type { BeadNode } from "./types";
import { STATUS_ICONS } from "./types";

interface BeadTreeProps {
  root: BeadNode;
}

interface NodeLineProps {
  node: BeadNode;
  prefix: string;
  isLast: boolean;
  isRoot: boolean;
}

function NodeLine({ node, prefix, isLast, isRoot }: NodeLineProps) {
  const icon = STATUS_ICONS[node.status];
  const connector = isRoot ? "" : isLast ? "└── " : "├── ";
  const blockerSuffix = node.blockedBy?.length
    ? ` [→${node.blockedBy[0]}]`
    : "";

  return (
    <Box>
      <Text color="gray">{prefix}{connector}</Text>
      <Text>{icon} </Text>
      <Text color="cyan">{node.id}</Text>
      <Text>  {node.title}</Text>
      {blockerSuffix && <Text color="red">{blockerSuffix}</Text>}
    </Box>
  );
}

interface SubtreeProps {
  node: BeadNode;
  prefix: string;
  isLast: boolean;
  isRoot: boolean;
}

function Subtree({ node, prefix, isLast, isRoot }: SubtreeProps) {
  // Build prefix for children
  const childPrefix = isRoot
    ? ""
    : prefix + (isLast ? "    " : "│   ");

  const children = node.children || [];

  return (
    <Box flexDirection="column">
      <NodeLine node={node} prefix={prefix} isLast={isLast} isRoot={isRoot} />
      {children.map((child, index) => (
        <Subtree
          key={child.id}
          node={child}
          prefix={childPrefix}
          isLast={index === children.length - 1}
          isRoot={false}
        />
      ))}
    </Box>
  );
}

export function BeadTree({ root }: BeadTreeProps) {
  return (
    <Box flexDirection="column">
      <Subtree node={root} prefix="" isLast={true} isRoot={true} />
    </Box>
  );
}
