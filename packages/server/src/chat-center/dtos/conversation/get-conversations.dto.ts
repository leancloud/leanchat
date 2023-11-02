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
    createdAt: z.preprocess(
      (str: string) => {
        try {
          return JSON.parse(str);
        } catch {}
      },
      z
        .object({
          gt: z.coerce.date(),
          lt: z.coerce.date(),
        })
        .partial(),
    ),
    limit: z.coerce.number().int().positive(),
  })
  .partial();

export class GetConversationsDto extends createZodDto(GetConversationsSchema) {}
