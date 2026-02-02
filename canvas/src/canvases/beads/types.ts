// Beads Canvas - Type Definitions

export type BeadStatus = 'pending' | 'ready' | 'in_progress' | 'completed' | 'blocked';

export interface BeadNode {
  id: string;
  title: string;
  status: BeadStatus;
  priority: number;
  assignee?: string;
  blockedBy?: string[];
  children?: BeadNode[];
}

// Status icons for display
export const STATUS_ICONS: Record<BeadStatus, string> = {
  pending: '📋',
  ready: '🟢',
  in_progress: '🔄',
  completed: '✅',
  blocked: '🛑',
};

export interface BeadTreeConfig {
  nodes: BeadNode[];
  title?: string;
}
