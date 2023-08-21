import { z } from 'zod';

export const BaseChatBotNodeSchema = z.object({
  id: z.string(),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
});

export const ChatBotEdgeSchema = z.object({
  sourceNode: z.string(),
  sourcePin: z.string(),
  targetNode: z.string(),
  targetPin: z.string(),
});

// Events

const OnConversationCreated = BaseChatBotNodeSchema.extend({
  type: z.literal('onConversationCreated'),
});

const OnVisitorInactive = BaseChatBotNodeSchema.extend({
  type: z.literal('onVisitorInactive'),
  inactiveDuration: z.number().int().positive(),
  repeatInterval: z.number().int().min(0),
});

// Actions

const DoSendMessage = BaseChatBotNodeSchema.extend({
  type: z.literal('doSendMessage'),
  message: z.object({
    content: z.string(),
  }),
});

const DoCloseConversation = BaseChatBotNodeSchema.extend({
  type: z.literal('doCloseConversation'),
});

export const ChatBotNodeSchema = z.discriminatedUnion('type', [
  OnConversationCreated,
  OnVisitorInactive,
  DoSendMessage,
  DoCloseConversation,
]);
