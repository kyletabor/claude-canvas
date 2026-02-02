import React from 'react';
import { Box, Text } from 'ink';
import type { BeadNode } from './types';
import { STATUS_ICONS } from './types';

// Tree drawing characters
const TREE_LAST = '└── ';
const TREE_MIDDLE = '├── ';
const TREE_PIPE = '│   ';
const TREE_SPACE = '    ';

interface BeadTreeProps {
  nodes: BeadNode[];
}

interface BeadNodeRowProps {
  node: BeadNode;
  prefix: string;
  isLast: boolean;
  isRoot: boolean;
}

function BeadNodeRow({ node, prefix, isLast, isRoot }: BeadNodeRowProps) {
  const icon = STATUS_ICONS[node.status];

  // Root nodes have no connector, children have tree connectors
  const connector = isRoot ? '' : (isLast ? TREE_LAST : TREE_MIDDLE);
  const childPrefix = isRoot ? '' : (prefix + (isLast ? TREE_SPACE : TREE_PIPE));

  // Format blocker indicator
  const blockerText = node.blockedBy && node.blockedBy.length > 0
    ? ` [→${node.blockedBy[0]}]`
    : '';

  return (
    <Box flexDirection="column">
      <Text>
        {prefix}{connector}{icon} {node.id}  {node.title}{blockerText}
      </Text>
      {node.children && node.children.length > 0 && (
        <Box flexDirection="column">
          {node.children.map((child, index) => (
            <BeadNodeRow
              key={child.id}
              node={child}
              prefix={childPrefix}
              isLast={index === node.children!.length - 1}
              isRoot={false}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

export function BeadTree({ nodes }: BeadTreeProps) {
  return (
    <Box flexDirection="column">
      {nodes.map((node, index) => (
        <BeadNodeRow
          key={node.id}
          node={node}
          prefix=""
          isLast={index === nodes.length - 1}
          isRoot={true}
        />
      ))}
    </Box>
  );
}
