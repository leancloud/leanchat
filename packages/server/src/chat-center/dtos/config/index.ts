import { z } from 'zod';

export const GreetingConfigSchema = z.object({
  enabled: z.boolean(),
  message: z.object({
    text: z.string(),
  }),
});

export const AutoCloseConversationSchema = z.object({
  timeout: z.number().int().min(0),
});

export const QueueConfigSchema = z.object({
  capacity: z.number().int().min(0),
  fullMessage: z.object({
    enabled: z.boolean(),
    text: z.string(),
  }),
  queuedMessage: z.object({
    enabled: z.boolean(),
    text: z.string(),
  }),
});
