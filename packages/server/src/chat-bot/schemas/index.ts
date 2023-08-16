import { z } from 'zod';

export const BaseChatBotNodeSchema = z.object({
  id: z.string(),
  next: z.array(z.string()),
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
