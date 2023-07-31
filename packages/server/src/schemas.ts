import { z } from 'zod';

export const message = z.object({
  text: z.string(),
});
