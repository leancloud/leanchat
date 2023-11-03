import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { BooleanStringSchema, ObjectIdSchema } from 'src/common/schemas';

const GetConversationsSchema = z
  .object({
    operatorId: z
      .union([z.literal('none'), ObjectIdSchema])
      .transform((str) => (str === 'none' ? null : str)),
    closed: BooleanStringSchema,
    desc: BooleanStringSchema,
    before: z.coerce.date(),
    after: z.coerce.date(),
    page: z.coerce.number().int().positive(),
    pageSize: z.coerce.number().int().min(1).max(100),
  })
  .partial();

export class GetConversationsDto extends createZodDto(GetConversationsSchema) {}
