import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

import { BooleanStringSchema } from 'src/common/schemas';

const GetMessagesSchema = z.object({
  desc: BooleanStringSchema.optional(),
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
