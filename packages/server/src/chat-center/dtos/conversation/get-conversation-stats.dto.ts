import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

import { DateStringSchema, ObjectIdSchema } from 'src/common/schemas';

const GetConversationStatsSchema = z.object({
  from: DateStringSchema,
  to: DateStringSchema,
  channel: z.string().optional(),
  operatorId: z
    .preprocess((s) => {
      if (typeof s === 'string') {
        return s.split(',');
      }
      return s;
    }, z.array(ObjectIdSchema))
    .optional(),
});

export class GetConversationStatsDto extends createZodDto(
  GetConversationStatsSchema,
) {}
