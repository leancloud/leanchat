import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

// TODO: too strict
const DateSchema = z.dateString().transform((s) => new Date(s));

const CountConversationStatsSchema = z.object({
  from: DateSchema,
  to: DateSchema,
});

export class CountConversationStatsDto extends createZodDto(
  CountConversationStatsSchema,
) {}
