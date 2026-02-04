import { describe, expect, it } from 'bun:test';
import { flattenTree, getTreePrefix } from '../canvases/beads/components/bead-tree';
import type { BeadNode, FlattenedNode } from '../canvases/beads/types';
import { TREE_CHARS } from '../canvases/beads/types';

const makeNode = (id: string, children?: BeadNode[]): BeadNode => ({
  id,
  title: `Node ${id}`,
  status: 'pending',
  priority: 1,
  children,
});

describe('flattenTree', () => {
  it('returns empty array for empty input', () => {
    const result = flattenTree([], new Set());
    expect(result).toEqual([]);
  });

  it('returns empty array for undefined/null-like input', () => {
    const result = flattenTree(undefined as unknown as BeadNode[], new Set());
    expect(result).toEqual([]);
  });

  it('flattens a single node without children', () => {
    const nodes = [makeNode('a')];
    const result = flattenTree(nodes, new Set());

    expect(result).toHaveLength(1);
    expect(result[0]!.node.id).toBe('a');
    expect(result[0]!.depth).toBe(0);
    expect(result[0]!.isLast).toBe(true);
    expect(result[0]!.hasChildren).toBe(false);
    expect(result[0]!.isExpanded).toBe(false);
    expect(result[0]!.parentPath).toEqual([]);
    expect(result[0]!.flatIndex).toBe(0);
  });

  it('flattens multiple root nodes', () => {
    const nodes = [makeNode('a'), makeNode('b'), makeNode('c')];
    const result = flattenTree(nodes, new Set());

    expect(result).toHaveLength(3);
    expect(result[0]!.isLast).toBe(false);
    expect(result[1]!.isLast).toBe(false);
    expect(result[2]!.isLast).toBe(true);
  });

  it('does not include children when not expanded', () => {
    const nodes = [makeNode('a', [makeNode('b')])];
    const result = flattenTree(nodes, new Set());

    expect(result).toHaveLength(1);
    expect(result[0]!.hasChildren).toBe(true);
    expect(result[0]!.isExpanded).toBe(false);
  });

  it('includes children when expanded', () => {
    const nodes = [makeNode('a', [makeNode('b')])];
    const result = flattenTree(nodes, new Set(['a']));

    expect(result).toHaveLength(2);
    expect(result[0]!.node.id).toBe('a');
    expect(result[0]!.isExpanded).toBe(true);
    expect(result[1]!.node.id).toBe('b');
    expect(result[1]!.depth).toBe(1);
    expect(result[1]!.parentPath).toEqual([true]); // a is last sibling
  });

  it('handles nested expanded tree', () => {
    const nodes = [
      makeNode('a', [
        makeNode('b', [makeNode('c')]),
      ]),
    ];
    const result = flattenTree(nodes, new Set(['a', 'b']));

    expect(result).toHaveLength(3);
    expect(result[0]!.depth).toBe(0);
    expect(result[1]!.depth).toBe(1);
    expect(result[2]!.depth).toBe(2);
    expect(result[2]!.parentPath).toEqual([true, true]);
  });

  it('tracks parentPath correctly for mixed siblings', () => {
    const nodes = [
      makeNode('a', [
        makeNode('a1'),
        makeNode('a2'),
      ]),
      makeNode('b', [makeNode('b1')]),
    ];
    const result = flattenTree(nodes, new Set(['a', 'b']));

    expect(result).toHaveLength(5);
    // a's children have parentPath [false] (a is not last)
    expect(result[1]!.parentPath).toEqual([false]);
    expect(result[2]!.parentPath).toEqual([false]);
    // b's children have parentPath [true] (b is last)
    expect(result[4]!.parentPath).toEqual([true]);
  });

  it('handles circular references without infinite loop', () => {
    const a: BeadNode = makeNode('a');
    const b: BeadNode = makeNode('b');
    a.children = [b];
    b.children = [a]; // circular!

    const result = flattenTree([a], new Set(['a', 'b']));

    // Should not hang, and should skip the circular ref
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThan(10); // Should not explode
  });

  it('handles nodes with empty children array as leaves', () => {
    const nodes = [makeNode('a', [])];
    const result = flattenTree(nodes, new Set(['a']));

    expect(result).toHaveLength(1);
    expect(result[0]!.hasChildren).toBe(false);
  });

  it('handles nodes with undefined children as leaves', () => {
    const nodes = [makeNode('a')];
    nodes[0]!.children = undefined;
    const result = flattenTree(nodes, new Set(['a']));

    expect(result).toHaveLength(1);
    expect(result[0]!.hasChildren).toBe(false);
  });
});

describe('getTreePrefix', () => {
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

  it('returns empty string for root node without children', () => {
    const prefix = getTreePrefix(makeFlatNode({ depth: 0, hasChildren: false }));
    expect(prefix).toBe('');
  });

  it('returns expand indicator for root node with children (collapsed)', () => {
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

  it('returns branch for depth 1 last sibling', () => {
    const prefix = getTreePrefix(makeFlatNode({
      depth: 1,
      isLast: true,
      hasChildren: false,
    }));
    expect(prefix).toBe(TREE_CHARS.LAST + TREE_CHARS.HORIZONTAL);
  });

  it('returns branch for depth 1 non-last sibling', () => {
    const prefix = getTreePrefix(makeFlatNode({
      depth: 1,
      isLast: false,
      hasChildren: false,
    }));
    expect(prefix).toBe(TREE_CHARS.BRANCH + TREE_CHARS.HORIZONTAL);
  });

  it('includes pipe for non-last parent', () => {
    const prefix = getTreePrefix(makeFlatNode({
      depth: 2,
      isLast: true,
      parentPath: [false], // parent was not last
      hasChildren: false,
    }));
    expect(prefix).toBe(TREE_CHARS.PIPE + '   ' + TREE_CHARS.LAST + TREE_CHARS.HORIZONTAL);
  });

  it('includes space for last parent', () => {
    const prefix = getTreePrefix(makeFlatNode({
      depth: 2,
      isLast: true,
      parentPath: [true], // parent was last
      hasChildren: false,
    }));
    expect(prefix).toBe('    ' + TREE_CHARS.LAST + TREE_CHARS.HORIZONTAL);
  });

  it('builds complex prefix for deeply nested node', () => {
    const prefix = getTreePrefix(makeFlatNode({
      depth: 3,
      isLast: false,
      parentPath: [false, true], // first parent not last, second was last
      hasChildren: true,
      isExpanded: true,
    }));
    // pipe + space + branch + horizontal + expanded
    expect(prefix).toBe(
      TREE_CHARS.PIPE + '   ' +
      '    ' +
      TREE_CHARS.BRANCH + TREE_CHARS.HORIZONTAL +
      TREE_CHARS.EXPANDED + ' '
    );
  });
});
