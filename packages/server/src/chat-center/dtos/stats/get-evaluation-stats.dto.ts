import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

import { ObjectIdSchema } from 'src/common/schemas';
import { Channel } from 'src/chat/constants';

const GetEvaluationStatsSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  channel: z.nativeEnum(Channel).optional(),
  operatorId: z
    .preprocess((s) => {
      if (typeof s === 'string') {
        return s.split(',');
      }
      return s;
    }, z.array(ObjectIdSchema))
    .optional(),
  page: z.coerce.number().positive().optional(),
  pageSize: z.coerce.number().min(1).max(1000).optional(),
});

export class GetEvaluationStatsDto extends createZodDto(
  GetEvaluationStatsSchema,
) {}
