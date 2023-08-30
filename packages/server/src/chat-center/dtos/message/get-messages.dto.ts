import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const GetMessagesSchema = z.object({
  desc: z
    .string()
    .transform((s) => {
      if (s === 'false' || s === '0') {
        return false;
      }
      return true;
    })
    .optional(),
  cursor: z
    .dateString()
    .transform((str) => new Date(str))
    .optional(),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform((str) => parseInt(str))
    .optional(),
});

export class GetMessagesDto extends createZodDto(GetMessagesSchema) {}
