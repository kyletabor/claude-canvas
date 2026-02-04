/**
 * Core types and constants for the Beads Canvas.
 * Defines the data structures for rendering hierarchical issue trees.
 */

/**
 * Status of a bead in the issue tree.
 */
export type BeadStatus = 'pending' | 'ready' | 'in_progress' | 'completed' | 'blocked';

/**
 * A node in the bead tree hierarchy.
 */
export interface BeadNode {
  /** Unique identifier (e.g., "epic.1.2") */
  id: string;
  /** Display title */
  title: string;
  /** Current status */
  status: BeadStatus;
  /** Priority level (1=highest) */
  priority: number;
  /** Optional owner/assignee */
  assignee?: string;
  /** IDs of blocking beads */
  blockedBy?: string[];
  /** Child beads */
  children?: BeadNode[];
}

/**
 * Configuration for the Beads Canvas component.
 */
export interface BeadsConfig {
  /** Root-level bead nodes */
  nodes: BeadNode[];
  /** Optional canvas title */
  title?: string;
  /** Current epic index */
  epicIndex?: number;
  /** Total number of epics */
  totalEpics?: number;
}

/**
 * Internal representation of a flattened tree node for rendering.
 * Used to convert hierarchical BeadNode trees into a flat list for display.
 */
export interface FlattenedNode {
  /** The original bead node */
  node: BeadNode;
  /** Depth level in the tree (0 = root) */
  depth: number;
  /** Whether this is the last sibling at its level */
  isLast: boolean;
  /** Whether this node is currently expanded */
  isExpanded: boolean;
  /** Whether this node has children */
  hasChildren: boolean;
  /** Array of booleans indicating if ancestors are last siblings (for tree drawing) */
  parentPath: boolean[];
  /** Index in the flattened list */
  flatIndex: number;
}

/**
 * Icons representing each bead status.
 */
export const STATUS_ICONS: Record<BeadStatus, string> = {
  pending: '📋',
  ready: '🟢',
  in_progress: '🔄',
  completed: '✅',
  blocked: '🛑',
};

/**
 * Icon displayed for unknown/unrecognized status values.
 */
export const UNKNOWN_STATUS_ICON = '❓';

/**
 * Characters used for drawing the tree structure.
 */
export const TREE_CHARS = {
  /** Vertical line connecting siblings */
  PIPE: '│',
  /** Branch connector for non-last siblings */
  BRANCH: '├',
  /** Branch connector for last sibling */
  LAST: '└',
  /** Horizontal line connecting to node */
  HORIZONTAL: '──',
  /** Indicator for expanded node with children */
  EXPANDED: '▼',
  /** Indicator for collapsed node with children */
  COLLAPSED: '▸',
} as const;

/**
 * Color scheme for bead canvas rendering.
 */
export const BEAD_COLORS = {
  /** Color for the currently selected node */
  selected: 'cyan',
  /** Color for header text */
  header: 'magenta',
  /** Default text color */
  normal: 'white',
  /** Color for dimmed/inactive text */
  dim: 'gray',
  /** Color for blocking indicators */
  blocker: 'red',
  /** Color for priority indicators */
  priority: 'yellow',
} as const;
