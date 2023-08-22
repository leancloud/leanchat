import { z } from 'zod';

import { MessageSchema } from 'src/message/schemas';

export const BaseChatbotNodeSchema = z.object({
  id: z.string(),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
});

export const ChatbotEdgeSchema = z.object({
  sourceNode: z.string(),
  sourcePin: z.string(),
  targetNode: z.string(),
  targetPin: z.string(),
});

// Events

const OnConversationCreated = BaseChatbotNodeSchema.extend({
  type: z.literal('onConversationCreated'),
});

const OnVisitorInactive = BaseChatbotNodeSchema.extend({
  type: z.literal('onVisitorInactive'),
  inactiveDuration: z.number().int().positive(),
  repeatInterval: z.number().int().min(0),
});

// Actions

const DoSendMessage = BaseChatbotNodeSchema.extend({
  type: z.literal('doSendMessage'),
  message: MessageSchema,
});

const DoCloseConversation = BaseChatbotNodeSchema.extend({
  type: z.literal('doCloseConversation'),
});

export const ChatbotNodeSchema = z.discriminatedUnion('type', [
  OnConversationCreated,
  OnVisitorInactive,
  DoSendMessage,
  DoCloseConversation,
]);
