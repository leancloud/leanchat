import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

import { ObjectIdSchema } from 'src/common/schemas';

const GetOperatorStatsSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  operatorId: z
    .preprocess((s: string) => s.split(','), z.array(ObjectIdSchema))
    .optional(),
});

export class GetOperatorStatsDto extends createZodDto(GetOperatorStatsSchema) {}
