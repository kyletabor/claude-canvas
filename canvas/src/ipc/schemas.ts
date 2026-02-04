/**
 * Zod schemas for IPC message validation.
 * Provides runtime validation for messages received from the controller.
 */

import { z } from "zod";

/**
 * Schema for IPC comment data structure.
 */
export const IPCCommentSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  selection: z.object({
    startOffset: z.number(),
    endOffset: z.number(),
    startLine: z.number(),
    endLine: z.number(),
    selectedText: z.string(),
  }),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Schema for bead status values.
 */
export const BeadStatusSchema = z.enum([
  "pending",
  "ready",
  "in_progress",
  "completed",
  "blocked",
]);

/**
 * Schema for a bead node in the tree hierarchy.
 */
export const BeadNodeSchema: z.ZodType<{
  id: string;
  title: string;
  status: "pending" | "ready" | "in_progress" | "completed" | "blocked";
  priority: number;
  assignee?: string;
  blockedBy?: string[];
  children?: unknown[];
}> = z.object({
  id: z.string(),
  title: z.string(),
  status: BeadStatusSchema,
  priority: z.number(),
  assignee: z.string().optional(),
  blockedBy: z.array(z.string()).optional(),
  children: z.lazy(() => z.array(BeadNodeSchema)).optional(),
});

/**
 * Schema for BeadsConfig sent via IPC update messages.
 */
export const BeadsConfigSchema = z.object({
  nodes: z.array(BeadNodeSchema),
  title: z.string().optional(),
  epicIndex: z.number().optional(),
  totalEpics: z.number().optional(),
});

/**
 * Schemas for individual controller message types.
 */
const CloseMessageSchema = z.object({ type: z.literal("close") });
const UpdateMessageSchema = z.object({
  type: z.literal("update"),
  config: z.unknown(),
});
const PingMessageSchema = z.object({ type: z.literal("ping") });
const GetSelectionMessageSchema = z.object({ type: z.literal("getSelection") });
const GetContentMessageSchema = z.object({ type: z.literal("getContent") });
const CommentResponseMessageSchema = z.object({
  type: z.literal("commentResponse"),
  data: z.object({
    commentId: z.string(),
    response: z.string(),
  }),
});
const ShowDetailsMessageSchema = z.object({
  type: z.literal("showDetails"),
  beadId: z.string(),
});

/**
 * Combined schema for all controller messages.
 * Validates the discriminated union of message types.
 */
export const ControllerMessageSchema = z.discriminatedUnion("type", [
  CloseMessageSchema,
  UpdateMessageSchema,
  PingMessageSchema,
  GetSelectionMessageSchema,
  GetContentMessageSchema,
  CommentResponseMessageSchema,
  ShowDetailsMessageSchema,
]);

/**
 * Type inferred from the schema (should match ControllerMessage in types.ts).
 */
export type ValidatedControllerMessage = z.infer<typeof ControllerMessageSchema>;

/**
 * Parse and validate a raw message as a ControllerMessage.
 * Throws ZodError if validation fails.
 */
export function parseControllerMessage(data: unknown): ValidatedControllerMessage {
  return ControllerMessageSchema.parse(data);
}

/**
 * Safely parse a ControllerMessage, returning null on failure.
 */
export function safeParseControllerMessage(
  data: unknown
): ValidatedControllerMessage | null {
  const result = ControllerMessageSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Validate that a config object matches BeadsConfig schema.
 * Returns typed BeadsConfig or throws ZodError.
 */
export function parseBeadsConfig(data: unknown): z.infer<typeof BeadsConfigSchema> {
  return BeadsConfigSchema.parse(data);
}

/**
 * Safely parse BeadsConfig, returning null on failure.
 */
export function safeParseBeadsConfig(
  data: unknown
): z.infer<typeof BeadsConfigSchema> | null {
  const result = BeadsConfigSchema.safeParse(data);
  return result.success ? result.data : null;
}
