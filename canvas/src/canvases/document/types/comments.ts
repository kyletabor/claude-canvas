// Comment System Types

export interface Comment {
  id: string;
  documentId: string;
  selection: {
    startOffset: number;
    endOffset: number;
    startLine: number;
    endLine: number;
    selectedText: string;
  };
  content: string;
  createdAt: string;
  updatedAt: string;
  thread: ThreadMessage[];
  status: 'open' | 'resolved';
}

export interface ThreadMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Comment box mode
export type CommentBoxMode = 'create' | 'view' | 'edit';

// Comment box state
export interface CommentBoxState {
  isOpen: boolean;
  mode: CommentBoxMode;
  commentId: string | null;  // null for new comments
  selection: {
    startOffset: number;
    endOffset: number;
    startLine: number;
    endLine: number;
    selectedText: string;
  } | null;
  inputText: string;
}

// Comments grouped by line for efficient lookup
export interface CommentsByLine {
  [line: number]: Comment[];
}
