// Inline Comment Box Component

import React from 'react';
import { Box, Text } from 'ink';
import type { CommentBoxState } from '../types/comments';
import type { Comment } from '../types/comments';

interface Props {
  state: CommentBoxState;
  comment?: Comment;  // For view/edit mode
  width: number;
}

// Truncate text with ellipsis
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

// Format selected text for display (max 2 lines)
function formatSelection(text: string, maxWidth: number): string[] {
  const lines = text.split('\n');
  if (lines.length <= 2) {
    return lines.map(line => truncate(line, maxWidth - 4));
  }
  return [
    truncate(lines[0], maxWidth - 4),
    '...',
    truncate(lines[lines.length - 1], maxWidth - 4),
  ];
}

export function CommentBox({ state, comment, width }: Props) {
  if (!state.isOpen) return null;

  const boxWidth = Math.min(width, 60);
  const innerWidth = boxWidth - 4; // Account for border padding

  const selectedText = state.selection?.selectedText || '';
  const formattedSelection = formatSelection(selectedText, innerWidth);

  // View mode: show existing comment with thread
  if (state.mode === 'view' && comment) {
    return (
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="cyan"
        width={boxWidth}
        paddingX={1}
      >
        {/* Header */}
        <Text color="gray" dimColor>
          Comment on line {comment.selection.startLine}
        </Text>

        {/* Selected text quote */}
        <Box borderStyle="single" borderColor="gray" marginY={0} paddingX={1}>
          {formattedSelection.map((line, i) => (
            <Text key={i} color="gray" dimColor>
              {line}
            </Text>
          ))}
        </Box>

        {/* Comment content */}
        <Box marginY={0}>
          <Text>{comment.content}</Text>
        </Box>

        {/* Thread (Claude responses) */}
        {comment.thread.length > 0 && (
          <Box flexDirection="column" marginTop={1} borderStyle="single" borderColor="blue" paddingX={1}>
            {comment.thread.map((msg, i) => (
              <Box key={i} flexDirection="column">
                <Text color={msg.role === 'assistant' ? 'cyan' : 'white'} bold>
                  {msg.role === 'assistant' ? 'Claude:' : 'You:'}
                </Text>
                <Text>{msg.content}</Text>
              </Box>
            ))}
          </Box>
        )}

        {/* Help */}
        <Text color="gray" dimColor>
          Enter: close | e: edit | d: delete | Ctrl+Enter: ask Claude
        </Text>
      </Box>
    );
  }

  // Create/Edit mode: show input
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="green"
      width={boxWidth}
      paddingX={1}
    >
      {/* Selected text quote */}
      <Box flexDirection="column" marginBottom={0}>
        {formattedSelection.map((line, i) => (
          <Text key={i} color="gray" dimColor>
            "{line}"
          </Text>
        ))}
      </Box>

      {/* Input area */}
      <Box flexDirection="column">
        <Text color="white">
          {'> '}{state.inputText}
          <Text backgroundColor="white" color="black">{' '}</Text>
        </Text>
      </Box>

      {/* Help text */}
      <Text color="gray" dimColor>
        Shift+Enter: newline | Enter: save | Esc: cancel
      </Text>
      <Text color="gray" dimColor>
        Ctrl+Enter: save and ask Claude
      </Text>
    </Box>
  );
}
