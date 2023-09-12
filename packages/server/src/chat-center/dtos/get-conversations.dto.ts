import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

import { BooleanStringSchema } from 'src/common/schemas';

const GetConversationsSchema = z.object({
  status: z.enum(['queued', 'inProgress', 'solved']).optional(),
  operatorId: z.string().optional(),
  sort: z
    .enum(['createdAt', 'queuedAt'])
    .transform((sort) => {
      switch (sort) {
        case 'createdAt':
          return sort;
        default:
          return 'timestamps.' + sort;
      }
    })
    .optional(),
  desc: BooleanStringSchema.optional(),
  cursor: z
    .dateString()
    .transform((str) => new Date(str))
    .optional(),
});

export class GetConversationsDto extends createZodDto(GetConversationsSchema) {}
