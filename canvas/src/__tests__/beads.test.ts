/**
 * Comprehensive tests for the Beads Canvas components.
 * Tests imports, core utilities, and edge cases for the beads module.
 */

import { describe, expect, it } from 'bun:test';
import type { BeadNode, BeadsConfig, FlattenedNode } from '../canvases/beads/types';
import { STATUS_ICONS, UNKNOWN_STATUS_ICON, TREE_CHARS, BEAD_COLORS } from '../canvases/beads/types';
import { flattenTree, getTreePrefix, BeadTree } from '../canvases/beads/components/bead-tree';

// Helper to create test nodes
const makeNode = (id: string, overrides?: Partial<BeadNode>): BeadNode => ({
  id,
  title: `Node ${id}`,
  status: 'ready',
  priority: 1,
  ...overrides,
});

// Helper to create flattened nodes for prefix testing
const makeFlatNode = (overrides?: Partial<FlattenedNode>): FlattenedNode => ({
  node: makeNode('test'),
  depth: 0,
  isLast: false,
  hasChildren: false,
  isExpanded: false,
  parentPath: [],
  flatIndex: 0,
  ...overrides,
});

// ============================================================================
// 1. Import Tests
// ============================================================================
describe('imports', () => {
  it('imports BeadNode type from types', () => {
    const node: BeadNode = {
      id: 'test',
      title: 'Test Node',
      status: 'pending',
      priority: 1,
    };
    expect(node.id).toBe('test');
    expect(node.status).toBe('pending');
  });

  it('imports BeadsConfig type from types', () => {
    const config: BeadsConfig = {
      nodes: [makeNode('a')],
      title: 'Test Config',
      epicIndex: 1,
      totalEpics: 3,
    };
    expect(config.nodes).toHaveLength(1);
    expect(config.title).toBe('Test Config');
  });

  it('imports FlattenedNode type from types', () => {
    const flat: FlattenedNode = makeFlatNode();
    expect(flat.depth).toBe(0);
    expect(flat.hasChildren).toBe(false);
  });

  it('imports STATUS_ICONS from types', () => {
    expect(STATUS_ICONS).toBeDefined();
    expect(STATUS_ICONS.pending).toBe('📋');
    expect(STATUS_ICONS.ready).toBe('🟢');
    expect(STATUS_ICONS.in_progress).toBe('🔄');
    expect(STATUS_ICONS.completed).toBe('✅');
    expect(STATUS_ICONS.blocked).toBe('🛑');
  });

  it('imports UNKNOWN_STATUS_ICON from types', () => {
    expect(UNKNOWN_STATUS_ICON).toBe('❓');
  });

  it('imports TREE_CHARS from types', () => {
    expect(TREE_CHARS).toBeDefined();
    expect(TREE_CHARS.PIPE).toBe('│');
    expect(TREE_CHARS.BRANCH).toBe('├');
    expect(TREE_CHARS.LAST).toBe('└');
    expect(TREE_CHARS.HORIZONTAL).toBe('──');
    expect(TREE_CHARS.EXPANDED).toBe('▼');
    expect(TREE_CHARS.COLLAPSED).toBe('▸');
  });

  it('imports BEAD_COLORS from types', () => {
    expect(BEAD_COLORS).toBeDefined();
    expect(BEAD_COLORS.selected).toBe('cyan');
    expect(BEAD_COLORS.header).toBe('magenta');
    expect(BEAD_COLORS.normal).toBe('white');
    expect(BEAD_COLORS.dim).toBe('gray');
    expect(BEAD_COLORS.blocker).toBe('red');
    expect(BEAD_COLORS.priority).toBe('yellow');
  });

  it('imports flattenTree from bead-tree', () => {
    expect(typeof flattenTree).toBe('function');
  });

  it('imports getTreePrefix from bead-tree', () => {
    expect(typeof getTreePrefix).toBe('function');
  });

  it('imports BeadTree component from bead-tree', () => {
    expect(typeof BeadTree).toBe('function');
  });
});

// ============================================================================
// 2. flattenTree Unit Tests
// ============================================================================
describe('flattenTree', () => {
  it('returns empty array for empty input', () => {
    expect(flattenTree([], new Set())).toEqual([]);
  });

  it('flattens single node', () => {
    const nodes = [{ id: 'a', title: 'A', status: 'ready' as const, priority: 1 }];
    const result = flattenTree(nodes, new Set());
    expect(result).toHaveLength(1);
    expect(result[0]!.depth).toBe(0);
  });

  it('flattens nested nodes when expanded', () => {
    const nodes: BeadNode[] = [{
      id: 'a',
      title: 'A',
      status: 'ready',
      priority: 1,
      children: [{ id: 'b', title: 'B', status: 'ready', priority: 1 }],
    }];
    const result = flattenTree(nodes, new Set(['a']));
    expect(result).toHaveLength(2);
    expect(result[1]!.depth).toBe(1);
  });

  it('does not include children when collapsed', () => {
    const nodes: BeadNode[] = [{
      id: 'a',
      title: 'A',
      status: 'ready',
      priority: 1,
      children: [{ id: 'b', title: 'B', status: 'ready', priority: 1 }],
    }];
    const result = flattenTree(nodes, new Set());
    expect(result).toHaveLength(1);
  });

  it('handles circular references without infinite loop', () => {
    // Create circular reference
    const a: BeadNode = makeNode('a');
    const b: BeadNode = makeNode('b');
    a.children = [b];
    b.children = [a]; // circular!

    const result = flattenTree([a], new Set(['a', 'b']));
    // Should not hang, should have limited results
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThan(10);
  });

  it('respects depth limit', () => {
    // Build deeply nested structure
    let current: BeadNode = makeNode('leaf');
    for (let i = 60; i > 0; i--) {
      current = makeNode(`level-${i}`, { children: [current] });
    }

    // Expand all
    const expandAll = new Set<string>();
    for (let i = 1; i <= 60; i++) {
      expandAll.add(`level-${i}`);
    }

    const result = flattenTree([current], expandAll);
    // Should be capped, not explode to 60+ nodes
    expect(result.length).toBeLessThanOrEqual(52); // MAX_DEPTH (50) + margin
  });

  it('correctly tracks isLast for siblings', () => {
    const nodes = [makeNode('a'), makeNode('b'), makeNode('c')];
    const result = flattenTree(nodes, new Set());

    expect(result[0]!.isLast).toBe(false);
    expect(result[1]!.isLast).toBe(false);
    expect(result[2]!.isLast).toBe(true);
  });

  it('correctly tracks hasChildren', () => {
    const nodes: BeadNode[] = [
      makeNode('a', { children: [makeNode('a1')] }),
      makeNode('b'),
    ];
    const result = flattenTree(nodes, new Set(['a']));

    expect(result[0]!.hasChildren).toBe(true);
    expect(result[1]!.hasChildren).toBe(false);
    expect(result[2]!.hasChildren).toBe(false);
  });

  it('correctly tracks parentPath for nested nodes', () => {
    const nodes: BeadNode[] = [
      makeNode('a', {
        children: [
          makeNode('a1', { children: [makeNode('a1a')] }),
          makeNode('a2'),
        ],
      }),
      makeNode('b'),
    ];
    const result = flattenTree(nodes, new Set(['a', 'a1']));

    // a's children should have [false] (a not last)
    expect(result[1]!.parentPath).toEqual([false]);
    // a1a (child of a1, grandchild of a)
    expect(result[2]!.parentPath).toEqual([false, false]);
  });

  it('correctly assigns flatIndex', () => {
    const nodes: BeadNode[] = [
      makeNode('a', { children: [makeNode('a1')] }),
      makeNode('b'),
    ];
    const result = flattenTree(nodes, new Set(['a']));

    expect(result[0]!.flatIndex).toBe(0);
    expect(result[1]!.flatIndex).toBe(1);
    expect(result[2]!.flatIndex).toBe(2);
  });
});

// ============================================================================
// 3. getTreePrefix Unit Tests
// ============================================================================
describe('getTreePrefix', () => {
  it('returns empty string for root nodes', () => {
    const flat = makeFlatNode({ depth: 0, isLast: false, hasChildren: false, parentPath: [] });
    expect(getTreePrefix(flat)).toBe('');
  });

  it('uses └ for last child', () => {
    const flat = makeFlatNode({ depth: 1, isLast: true, hasChildren: false, parentPath: [] });
    expect(getTreePrefix(flat)).toContain('└');
  });

  it('uses ├ for non-last child', () => {
    const flat = makeFlatNode({ depth: 1, isLast: false, hasChildren: false, parentPath: [] });
    expect(getTreePrefix(flat)).toContain('├');
  });

  it('adds expand indicator for nodes with children (collapsed)', () => {
    const flat = makeFlatNode({ depth: 1, isLast: false, hasChildren: true, isExpanded: false, parentPath: [] });
    expect(getTreePrefix(flat)).toContain('▸');
  });

  it('adds expand indicator for nodes with children (expanded)', () => {
    const flat = makeFlatNode({ depth: 1, isLast: false, hasChildren: true, isExpanded: true, parentPath: [] });
    expect(getTreePrefix(flat)).toContain('▼');
  });

  it('adds collapse indicator for root with children (collapsed)', () => {
    const flat = makeFlatNode({ depth: 0, hasChildren: true, isExpanded: false });
    expect(getTreePrefix(flat)).toBe(TREE_CHARS.COLLAPSED + ' ');
  });

  it('adds expand indicator for root with children (expanded)', () => {
    const flat = makeFlatNode({ depth: 0, hasChildren: true, isExpanded: true });
    expect(getTreePrefix(flat)).toBe(TREE_CHARS.EXPANDED + ' ');
  });

  it('includes vertical pipe for non-last ancestor', () => {
    const flat = makeFlatNode({
      depth: 2,
      isLast: true,
      parentPath: [false], // ancestor was not last
      hasChildren: false,
    });
    expect(getTreePrefix(flat)).toContain(TREE_CHARS.PIPE);
  });

  it('includes space (no pipe) for last ancestor', () => {
    const flat = makeFlatNode({
      depth: 2,
      isLast: true,
      parentPath: [true], // ancestor was last
      hasChildren: false,
    });
    const prefix = getTreePrefix(flat);
    // Should have spaces instead of pipe for the first level
    expect(prefix.startsWith('    ')).toBe(true);
  });
});

// ============================================================================
// 4. Edge Case Tests
// ============================================================================
describe('edge cases', () => {
  it('handles undefined children', () => {
    const nodes: BeadNode[] = [{ id: 'a', title: 'A', status: 'ready', priority: 1, children: undefined }];
    expect(flattenTree(nodes, new Set())).toHaveLength(1);
  });

  it('handles empty children array', () => {
    const nodes: BeadNode[] = [{ id: 'a', title: 'A', status: 'ready', priority: 1, children: [] }];
    const result = flattenTree(nodes, new Set());
    expect(result[0]!.hasChildren).toBe(false);
  });

  it('unknown status gets fallback icon', () => {
    // STATUS_ICONS is a Record<BeadStatus, string>, so unknown keys return undefined
    expect((STATUS_ICONS as Record<string, string>)['unknown']).toBeUndefined();
    // UNKNOWN_STATUS_ICON should be used as fallback
    expect(UNKNOWN_STATUS_ICON).toBeDefined();
  });

  it('handles null-like nodes in array', () => {
    const nodes = [makeNode('a'), null as unknown as BeadNode, makeNode('b')];
    // Should handle gracefully (skip nulls)
    const result = flattenTree(nodes, new Set());
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('BeadTree handles empty nodes array', () => {
    expect(() =>
      BeadTree({
        nodes: [],
        selectedIndex: 0,
        scrollOffset: 0,
        viewportHeight: 10,
        width: 80,
      })
    ).not.toThrow();
  });

  it('BeadTree handles undefined nodes', () => {
    expect(() =>
      BeadTree({
        nodes: undefined as unknown as FlattenedNode[],
        selectedIndex: 0,
        scrollOffset: 0,
        viewportHeight: 10,
        width: 80,
      })
    ).not.toThrow();
  });

  it('BeadTree handles scroll past end', () => {
    const nodes = [makeFlatNode({ node: makeNode('a'), flatIndex: 0 })];
    expect(() =>
      BeadTree({
        nodes,
        selectedIndex: 100, // way past end
        scrollOffset: 100,
        viewportHeight: 10,
        width: 80,
      })
    ).not.toThrow();
  });

  it('BeadTree handles negative dimensions gracefully', () => {
    const nodes = [makeFlatNode({ node: makeNode('a'), flatIndex: 0 })];
    expect(() =>
      BeadTree({
        nodes,
        selectedIndex: 0,
        scrollOffset: 0,
        viewportHeight: -1,
        width: -1,
      })
    ).not.toThrow();
  });

  it('handles special characters in node title', () => {
    const nodes = [makeNode('a', { title: '📝 Special <chars> & "quotes"' })];
    const result = flattenTree(nodes, new Set());
    expect(result[0]!.node.title).toBe('📝 Special <chars> & "quotes"');
  });

  it('handles very long node id', () => {
    const longId = 'a'.repeat(500);
    const nodes = [makeNode(longId)];
    const result = flattenTree(nodes, new Set());
    expect(result[0]!.node.id).toBe(longId);
  });

  it('handles nodes with all optional fields', () => {
    const node: BeadNode = {
      id: 'full',
      title: 'Full Node',
      status: 'blocked',
      priority: 1,
      assignee: 'test-user',
      blockedBy: ['other-1', 'other-2'],
      children: [makeNode('child')],
    };
    const result = flattenTree([node], new Set(['full']));
    expect(result).toHaveLength(2);
    expect(result[0]!.node.assignee).toBe('test-user');
    expect(result[0]!.node.blockedBy).toEqual(['other-1', 'other-2']);
  });
});

// ============================================================================
// 5. Integration Tests
// ============================================================================
describe('integration', () => {
  it('full workflow: create nodes, flatten, get prefixes', () => {
    // Create a realistic tree structure
    const tree: BeadNode[] = [
      makeNode('epic-1', {
        title: 'Epic 1',
        status: 'in_progress',
        children: [
          makeNode('task-1.1', {
            title: 'Task 1.1',
            status: 'completed',
          }),
          makeNode('task-1.2', {
            title: 'Task 1.2',
            status: 'in_progress',
            children: [
              makeNode('subtask-1.2.1', {
                title: 'Subtask 1.2.1',
                status: 'ready',
              }),
            ],
          }),
        ],
      }),
      makeNode('epic-2', {
        title: 'Epic 2',
        status: 'pending',
      }),
    ];

    // Expand epic-1 and task-1.2
    const expanded = new Set(['epic-1', 'task-1.2']);
    const flattened = flattenTree(tree, expanded);

    // Should have: epic-1, task-1.1, task-1.2, subtask-1.2.1, epic-2
    expect(flattened).toHaveLength(5);

    // Check depths
    expect(flattened[0]!.depth).toBe(0); // epic-1
    expect(flattened[1]!.depth).toBe(1); // task-1.1
    expect(flattened[2]!.depth).toBe(1); // task-1.2
    expect(flattened[3]!.depth).toBe(2); // subtask-1.2.1
    expect(flattened[4]!.depth).toBe(0); // epic-2

    // Check prefixes are generated without throwing
    for (const node of flattened) {
      expect(() => getTreePrefix(node)).not.toThrow();
    }

    // Check specific prefixes
    const prefixEpic1 = getTreePrefix(flattened[0]!);
    expect(prefixEpic1).toContain(TREE_CHARS.EXPANDED); // has expanded children

    const prefixTask11 = getTreePrefix(flattened[1]!);
    expect(prefixTask11).toContain(TREE_CHARS.BRANCH); // not last child

    const prefixTask12 = getTreePrefix(flattened[2]!);
    expect(prefixTask12).toContain(TREE_CHARS.LAST); // is last child at depth 1
    expect(prefixTask12).toContain(TREE_CHARS.EXPANDED); // has expanded children

    const prefixEpic2 = getTreePrefix(flattened[4]!);
    expect(prefixEpic2).toBe(''); // root without children
  });
});
