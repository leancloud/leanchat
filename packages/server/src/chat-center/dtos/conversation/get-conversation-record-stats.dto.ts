import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod';

import {
  BooleanStringSchema,
  DateStringSchema,
  ObjectIdSchema,
} from 'src/common/schemas';

const NumberConditionSchema = z
  .string()
  .regex(/^[><]\d+$/)
  .transform((s) => {
    if (s.startsWith('>')) {
      return { gt: parseInt(s.slice(1)) };
    } else {
      return { lt: parseInt(s.slice(1)) };
    }
  });

const GetConversationRecordStatsSchema = z.object({
  from: DateStringSchema,
  to: DateStringSchema,
  visitorId: ObjectIdSchema.optional(),
  operatorId: ObjectIdSchema.optional(),
  keyword: z.string().optional(),
  duration: NumberConditionSchema.optional(),
  averageResponseTime: NumberConditionSchema.optional(),
  evaluationStar: z
    .enum(['1', '2', '3', '4', '5'])
    .transform((s) => parseInt(s))
    .optional(),
  limit: z
    .preprocess((s) => Number(s), z.number().int().min(1).max(100))
    .optional(),
  desc: BooleanStringSchema.optional(),
});

export class GetConversationRecordStatsDto extends createZodDto(
  GetConversationRecordStatsSchema,
) {}
