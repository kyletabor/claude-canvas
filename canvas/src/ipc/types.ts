// IPC Message Types for Canvas Communication

// Comment data structure for IPC
export interface IPCComment {
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
}

// Messages sent from Controller (Claude) to Canvas
export type ControllerMessage =
  | { type: "close" }
  | { type: "update"; config: unknown }
  | { type: "ping" }
  | { type: "getSelection" }
  | { type: "getContent" }
  | { type: "commentResponse"; data: { commentId: string; response: string } }
  // Beads canvas messages
  | { type: "showDetails"; beadId: string };

// Messages sent from Canvas to Controller (Claude)
export type CanvasMessage =
  | { type: "ready"; scenario: string }
  | { type: "selected"; data: unknown }
  | { type: "cancelled"; reason?: string }
  | { type: "error"; message: string }
  | { type: "pong" }
  | { type: "selection"; data: { selectedText: string; startOffset: number; endOffset: number } | null }
  | { type: "content"; data: { content: string; cursorPosition: number } }
  | { type: "commentCreated"; data: IPCComment }
  | { type: "commentTrigger"; data: { comment: IPCComment; documentContext: string } }
  | { type: "exportComments"; data: { format: 'markdown' | 'json'; comments: IPCComment[] } }
  // Beads canvas messages
  | { type: "beadSelected"; beadId: string }
  | { type: "requestDetails"; beadId: string }
  | { type: "requestBlockers"; beadId: string }
  | { type: "beadRefresh" }
  | { type: "epicNav"; direction: "prev" | "next" };

// Socket path convention
export function getSocketPath(id: string): string {
  return `/tmp/canvas-${id}.sock`;
}
