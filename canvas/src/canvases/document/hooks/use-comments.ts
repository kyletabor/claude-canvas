// Comment State Management Hook

import { useState, useCallback, useMemo } from 'react';
import type { Comment, CommentBoxState, CommentsByLine, ThreadMessage } from '../types/comments';

// Generate a simple unique ID
function generateId(): string {
  return `comment-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface UseCommentsOptions {
  documentId: string;
  onCommentCreated?: (comment: Comment) => void;
  onCommentTrigger?: (comment: Comment, context: string) => void;
}

export interface UseCommentsResult {
  comments: Comment[];
  commentsByLine: CommentsByLine;
  commentBox: CommentBoxState;

  // Actions
  openCommentBox: (selection: CommentBoxState['selection']) => void;
  closeCommentBox: () => void;
  setCommentInput: (text: string) => void;
  saveComment: (triggerClaude?: boolean) => void;
  viewComment: (commentId: string) => void;
  editComment: (commentId: string) => void;
  deleteComment: (commentId: string) => void;
  navigateToNextComment: (fromLine: number) => number | null;
  navigateToPrevComment: (fromLine: number) => number | null;
  addResponse: (commentId: string, response: string) => void;
}

export function useComments(options: UseCommentsOptions): UseCommentsResult {
  const { documentId, onCommentCreated, onCommentTrigger } = options;

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentBox, setCommentBox] = useState<CommentBoxState>({
    isOpen: false,
    mode: 'create',
    commentId: null,
    selection: null,
    inputText: '',
  });

  // Index comments by line for efficient lookup
  const commentsByLine = useMemo(() => {
    const byLine: CommentsByLine = {};
    for (const comment of comments) {
      const line = comment.selection.startLine;
      if (!byLine[line]) {
        byLine[line] = [];
      }
      byLine[line].push(comment);
    }
    return byLine;
  }, [comments]);

  // Open comment box for new comment
  const openCommentBox = useCallback((selection: CommentBoxState['selection']) => {
    if (!selection) return;
    setCommentBox({
      isOpen: true,
      mode: 'create',
      commentId: null,
      selection,
      inputText: '',
    });
  }, []);

  // Close comment box
  const closeCommentBox = useCallback(() => {
    setCommentBox({
      isOpen: false,
      mode: 'create',
      commentId: null,
      selection: null,
      inputText: '',
    });
  }, []);

  // Update comment input text
  const setCommentInput = useCallback((text: string) => {
    setCommentBox(prev => ({ ...prev, inputText: text }));
  }, []);

  // Save comment (create or update)
  const saveComment = useCallback((triggerClaude = false) => {
    const { mode, commentId, selection, inputText } = commentBox;

    if (!inputText.trim()) return;

    if (mode === 'create' && selection) {
      // Create new comment
      const newComment: Comment = {
        id: generateId(),
        documentId,
        selection,
        content: inputText.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        thread: [],
        status: 'open',
      };

      setComments(prev => [...prev, newComment]);
      onCommentCreated?.(newComment);

      if (triggerClaude && onCommentTrigger) {
        onCommentTrigger(newComment, selection.selectedText);
      }
    } else if (mode === 'edit' && commentId) {
      // Update existing comment
      setComments(prev => prev.map(c =>
        c.id === commentId
          ? { ...c, content: inputText.trim(), updatedAt: new Date().toISOString() }
          : c
      ));
    }

    closeCommentBox();
  }, [commentBox, documentId, onCommentCreated, onCommentTrigger, closeCommentBox]);

  // View existing comment
  const viewComment = useCallback((commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    setCommentBox({
      isOpen: true,
      mode: 'view',
      commentId,
      selection: comment.selection,
      inputText: comment.content,
    });
  }, [comments]);

  // Edit existing comment
  const editComment = useCallback((commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    setCommentBox({
      isOpen: true,
      mode: 'edit',
      commentId,
      selection: comment.selection,
      inputText: comment.content,
    });
  }, [comments]);

  // Delete comment
  const deleteComment = useCallback((commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
    closeCommentBox();
  }, [closeCommentBox]);

  // Navigate to next comment from current line
  const navigateToNextComment = useCallback((fromLine: number): number | null => {
    const linesWithComments = Object.keys(commentsByLine)
      .map(Number)
      .sort((a, b) => a - b);

    const nextLine = linesWithComments.find(line => line > fromLine);
    return nextLine ?? linesWithComments[0] ?? null; // Wrap around
  }, [commentsByLine]);

  // Navigate to previous comment from current line
  const navigateToPrevComment = useCallback((fromLine: number): number | null => {
    const linesWithComments = Object.keys(commentsByLine)
      .map(Number)
      .sort((a, b) => b - a);

    const prevLine = linesWithComments.find(line => line < fromLine);
    return prevLine ?? linesWithComments[0] ?? null; // Wrap around
  }, [commentsByLine]);

  // Add Claude's response to a comment thread
  const addResponse = useCallback((commentId: string, response: string) => {
    setComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;

      const newMessage: ThreadMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };

      return {
        ...c,
        thread: [...c.thread, newMessage],
        updatedAt: new Date().toISOString(),
      };
    }));
  }, []);

  return {
    comments,
    commentsByLine,
    commentBox,
    openCommentBox,
    closeCommentBox,
    setCommentInput,
    saveComment,
    viewComment,
    editComment,
    deleteComment,
    navigateToNextComment,
    navigateToPrevComment,
    addResponse,
  };
}
