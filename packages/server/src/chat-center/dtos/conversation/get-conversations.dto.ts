import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

import { BooleanStringSchema, ObjectIdSchema } from 'src/common/schemas';

const GetConversationsSchema = z.object({
  operatorId: z
    .union([z.literal('none'), ObjectIdSchema])
    .transform((str) => (str === 'none' ? null : str))
    .optional(),
  status: z.enum(['open', 'closed']).optional(),
  desc: BooleanStringSchema.optional(),
});

export class GetConversationsDto extends createZodDto(GetConversationsSchema) {}
