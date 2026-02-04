/**
 * Shared test utilities for beads canvas tests.
 * Provides factory functions to create test nodes and flattened nodes.
 */

import type { BeadNode, FlattenedNode } from '../canvases/beads/types';

/**
 * Creates a test BeadNode with sensible defaults.
 *
 * @param id - Node identifier (defaults to 'test')
 * @param overrides - Optional partial BeadNode to override defaults
 * @returns A complete BeadNode
 *
 * @example
 * makeNode('a')
 * makeNode('a', { status: 'completed' })
 * makeNode('parent', { children: [makeNode('child')] })
 */
export const makeNode = (id = 'test', overrides?: Partial<BeadNode>): BeadNode => ({
  id,
  title: `Node ${id}`,
  status: 'pending',
  priority: 1,
  ...overrides,
});

/**
 * Creates a test FlattenedNode with sensible defaults.
 *
 * @param nodeOverrides - Optional partial BeadNode to override the inner node
 * @param flatOverrides - Optional partial FlattenedNode to override flat properties
 * @returns A complete FlattenedNode
 *
 * @example
 * makeFlatNode()
 * makeFlatNode({ status: 'blocked' })
 * makeFlatNode({}, { depth: 2, isLast: true })
 * makeFlatNode({ id: 'custom' }, { flatIndex: 5 })
 */
export const makeFlatNode = (
  nodeOverrides: Partial<BeadNode> = {},
  flatOverrides: Partial<Omit<FlattenedNode, 'node'>> = {},
): FlattenedNode => ({
  node: makeNode(nodeOverrides.id ?? 'test', nodeOverrides),
  depth: 0,
  isLast: true,
  isExpanded: false,
  hasChildren: false,
  parentPath: [],
  flatIndex: 0,
  ...flatOverrides,
});
