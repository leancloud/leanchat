import { z } from 'zod';

export const MessageSchema = z.object({
  text: z.string(),
});
