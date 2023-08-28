import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const GetConversationsSchema = z.object({
  status: z.enum(['queued', 'inProgress', 'solved']).optional(),
  operatorId: z.string().optional(),
  sort: z.enum(['createdAt', 'queuedAt']).optional(),
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
});

export class GetConversationsDto extends createZodDto(GetConversationsSchema) {}
