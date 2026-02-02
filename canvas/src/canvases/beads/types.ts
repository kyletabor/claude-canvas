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

export interface BeadTreeConfig {
  root: BeadNode;
  title?: string;
}

// Status icons mapping
export const STATUS_ICONS: Record<BeadStatus, string> = {
  pending: '📋',
  ready: '🟢',
  in_progress: '🔄',
  completed: '✅',
  blocked: '🛑',
};
