import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

// TODO: too strict
const DateSchema = z.dateString().transform((s) => new Date(s));

const ObjectIdSchema = z
  .string()
  .length(24)
  .regex(/^[0-9A-Fa-f]+$/);

const GetConversationStatsSchema = z.object({
  from: DateSchema,
  to: DateSchema,
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
