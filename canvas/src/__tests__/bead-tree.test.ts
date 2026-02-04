/**
 * Tests for BeadTree component and getTreePrefix utility.
 *
 * Note: flattenTree tests have been consolidated into beads.test.ts
 * to avoid duplication.
 */

import { describe, expect, it } from 'bun:test';
import { getTreePrefix, BeadTree } from '../canvases/beads/components/bead-tree';
import type { BeadNode, FlattenedNode } from '../canvases/beads/types';
import { TREE_CHARS } from '../canvases/beads/types';

const makeNode = (id: string, children?: BeadNode[]): BeadNode => ({
  id,
  title: `Node ${id}`,
  status: 'pending',
  priority: 1,
  children,
});

const makeFlatNode = (overrides: Partial<FlattenedNode>): FlattenedNode => ({
  node: makeNode('test'),
  depth: 0,
  isLast: true,
  isExpanded: false,
  hasChildren: false,
  parentPath: [],
  flatIndex: 0,
  ...overrides,
});

// ============================================================================
// getTreePrefix Tests
// ============================================================================

describe('getTreePrefix', () => {
  it('returns empty string for root node without children', () => {
    const prefix = getTreePrefix(makeFlatNode({ depth: 0, hasChildren: false }));
    expect(prefix).toBe('');
  });

  it('returns collapse indicator for root node with children (collapsed)', () => {
    const prefix = getTreePrefix(makeFlatNode({
      depth: 0,
      hasChildren: true,
      isExpanded: false,
    }));
    expect(prefix).toBe(TREE_CHARS.COLLAPSED + ' ');
  });

  it('returns expand indicator for root node with children (expanded)', () => {
    const prefix = getTreePrefix(makeFlatNode({
      depth: 0,
      hasChildren: true,
      isExpanded: true,
    }));
    expect(prefix).toBe(TREE_CHARS.EXPANDED + ' ');
  });

  it('uses └ branch for last sibling at depth 1', () => {
    const prefix = getTreePrefix(makeFlatNode({
      depth: 1,
      isLast: true,
      hasChildren: false,
    }));
    expect(prefix).toBe(TREE_CHARS.LAST + TREE_CHARS.HORIZONTAL);
  });

  it('uses ├ branch for non-last sibling at depth 1', () => {
    const prefix = getTreePrefix(makeFlatNode({
      depth: 1,
      isLast: false,
      hasChildren: false,
    }));
    expect(prefix).toBe(TREE_CHARS.BRANCH + TREE_CHARS.HORIZONTAL);
  });

  it('includes pipe │ for non-last parent in ancestry', () => {
    const prefix = getTreePrefix(makeFlatNode({
      depth: 2,
      isLast: true,
      parentPath: [false], // parent was not last
      hasChildren: false,
    }));
    expect(prefix).toBe(TREE_CHARS.PIPE + '   ' + TREE_CHARS.LAST + TREE_CHARS.HORIZONTAL);
  });

  it('includes space for last parent in ancestry', () => {
    const prefix = getTreePrefix(makeFlatNode({
      depth: 2,
      isLast: true,
      parentPath: [true], // parent was last
      hasChildren: false,
    }));
    expect(prefix).toBe('    ' + TREE_CHARS.LAST + TREE_CHARS.HORIZONTAL);
  });

  it('builds complex prefix for deeply nested node with children', () => {
    const prefix = getTreePrefix(makeFlatNode({
      depth: 3,
      isLast: false,
      parentPath: [false, true], // first parent not last, second was last
      hasChildren: true,
      isExpanded: true,
    }));
    // │   (for non-last parent) + 4 spaces (for last parent) + ├── + ▼ + space
    expect(prefix).toBe(
      TREE_CHARS.PIPE + '   ' +
      '    ' +
      TREE_CHARS.BRANCH + TREE_CHARS.HORIZONTAL +
      TREE_CHARS.EXPANDED + ' '
    );
  });

  it('builds prefix with multiple levels of ancestry', () => {
    const prefix = getTreePrefix(makeFlatNode({
      depth: 4,
      isLast: true,
      parentPath: [false, false, true], // varied ancestry
      hasChildren: false,
    }));
    // │   │   space   └──
    expect(prefix).toBe(
      TREE_CHARS.PIPE + '   ' +
      TREE_CHARS.PIPE + '   ' +
      '    ' +
      TREE_CHARS.LAST + TREE_CHARS.HORIZONTAL
    );
  });
});

// ============================================================================
// BeadTree Component Tests
// ============================================================================

describe('BeadTree Component', () => {
  const makeFlatNodeForTree = (id: string, flatIndex: number, overrides?: Partial<FlattenedNode>): FlattenedNode => ({
    node: makeNode(id),
    depth: 0,
    isLast: true,
    isExpanded: false,
    hasChildren: false,
    parentPath: [],
    flatIndex,
    ...overrides,
  });

  it('exports BeadTree function', () => {
    expect(typeof BeadTree).toBe('function');
  });

  it('renders empty state message when nodes is empty', () => {
    const result = BeadTree({
      nodes: [],
      selectedIndex: 0,
      scrollOffset: 0,
      viewportHeight: 10,
      width: 80,
    });

    // Should render without throwing
    expect(result).toBeDefined();
    // Check for empty state text in the output
    const texts: string[] = [];
    function extractText(node: unknown): void {
      if (typeof node === 'string' || typeof node === 'number') texts.push(String(node));
      if (typeof node === 'object' && node !== null) {
        const elem = node as { props?: { children?: unknown } };
        if (elem.props?.children) {
          if (Array.isArray(elem.props.children)) {
            elem.props.children.forEach(extractText);
          } else {
            extractText(elem.props.children);
          }
        }
      }
    }
    extractText(result);
    expect(texts.join('')).toContain('No beads to display');
  });

  it('renders nodes without throwing', () => {
    const nodes = [makeFlatNodeForTree('a', 0), makeFlatNodeForTree('b', 1)];
    expect(() => BeadTree({
      nodes,
      selectedIndex: 0,
      scrollOffset: 0,
      viewportHeight: 10,
      width: 80,
    })).not.toThrow();
  });

  it('handles scrollOffset greater than 0', () => {
    const nodes = Array.from({ length: 20 }, (_, i) => makeFlatNodeForTree(`node-${i}`, i));
    const result = BeadTree({
      nodes,
      selectedIndex: 10,
      scrollOffset: 5,
      viewportHeight: 10,
      width: 80,
    });
    expect(result).toBeDefined();
  });

  it('shows top scroll indicator when items above viewport', () => {
    const nodes = Array.from({ length: 20 }, (_, i) => makeFlatNodeForTree(`node-${i}`, i));
    const result = BeadTree({
      nodes,
      selectedIndex: 10,
      scrollOffset: 5,
      viewportHeight: 10,
      width: 80,
    });

    // Extract text to check for scroll indicator
    const texts: string[] = [];
    function extractText(node: unknown): void {
      if (typeof node === 'string' || typeof node === 'number') texts.push(String(node));
      if (typeof node === 'object' && node !== null) {
        const elem = node as { props?: { children?: unknown } };
        if (elem.props?.children) {
          if (Array.isArray(elem.props.children)) {
            elem.props.children.forEach(extractText);
          } else {
            extractText(elem.props.children);
          }
        }
      }
    }
    extractText(result);
    const text = texts.join('');
    expect(text).toContain('↑');
    expect(text).toContain('more');
    // itemsAbove = scrollOffset = 5
    expect(text).toMatch(/↑.*5.*more/);
  });

  it('shows bottom scroll indicator when items below viewport', () => {
    const nodes = Array.from({ length: 20 }, (_, i) => makeFlatNodeForTree(`node-${i}`, i));
    const result = BeadTree({
      nodes,
      selectedIndex: 5,
      scrollOffset: 0,
      viewportHeight: 10,
      width: 80,
    });

    // Extract text to check for scroll indicator
    const texts: string[] = [];
    function extractText(node: unknown): void {
      if (typeof node === 'string' || typeof node === 'number') texts.push(String(node));
      if (typeof node === 'object' && node !== null) {
        const elem = node as { props?: { children?: unknown } };
        if (elem.props?.children) {
          if (Array.isArray(elem.props.children)) {
            elem.props.children.forEach(extractText);
          } else {
            extractText(elem.props.children);
          }
        }
      }
    }
    extractText(result);
    const text = texts.join('');
    expect(text).toContain('↓');
    expect(text).toContain('more');
    // Should show how many items are below
    expect(text).toMatch(/↓.*\d+.*more/);
  });

  it('handles viewportHeight larger than total nodes', () => {
    const nodes = [makeFlatNodeForTree('a', 0)];
    const result = BeadTree({
      nodes,
      selectedIndex: 0,
      scrollOffset: 0,
      viewportHeight: 100,
      width: 80,
    });
    expect(result).toBeDefined();
  });

  it('handles narrow width', () => {
    const nodes = [makeFlatNodeForTree('a', 0)];
    const result = BeadTree({
      nodes,
      selectedIndex: 0,
      scrollOffset: 0,
      viewportHeight: 10,
      width: 20,
    });
    expect(result).toBeDefined();
  });

  it('handles undefined nodes gracefully', () => {
    expect(() => BeadTree({
      nodes: undefined as unknown as FlattenedNode[],
      selectedIndex: 0,
      scrollOffset: 0,
      viewportHeight: 10,
      width: 80,
    })).not.toThrow();
  });
});
