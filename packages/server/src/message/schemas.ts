import { z } from 'zod';

const TextMessageSchema = z.object({
  type: z.literal('text'),
  content: z.string(),
});

const FileMessageSchema = z.object({
  type: z.literal('file'),
  name: z.string(),
  url: z.string(),
  mime: z.string().optional(),
  size: z.number().optional(),
});

export const MessageSchema = z.discriminatedUnion('type', [
  TextMessageSchema,
  FileMessageSchema,
]);
