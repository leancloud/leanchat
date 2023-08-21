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

export const OnConversationCreated = BaseChatBotNodeSchema.extend({
  type: z.literal('onConversationCreated'),
});

export const DoSendMessage = BaseChatBotNodeSchema.extend({
  type: z.literal('doSendMessage'),
  message: z.object({
    content: z.string(),
  }),
});

export const ChatBotNodeSchema = z.discriminatedUnion('type', [
  OnConversationCreated,
  DoSendMessage,
]);
