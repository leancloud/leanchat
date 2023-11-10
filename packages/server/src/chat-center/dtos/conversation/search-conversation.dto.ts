import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

import { Channel, ConsultationResult, UserType } from 'src/chat/constants';
import { ObjectIdSchema } from 'src/common/schemas';

function querySchema<T>(schema: z.Schema<T>) {
  return z
    .object({
      gt: schema,
      lt: schema,
    })
    .partial();
}

const SearchConversationSchema = z.object({
  // date range
  from: z.coerce.date(),
  to: z.coerce.date(),

  // optional filters
  channel: z.nativeEnum(Channel).optional(),
  categoryId: z.array(ObjectIdSchema).optional(),
  visitorId: z.array(ObjectIdSchema).optional(),
  operatorId: z.array(ObjectIdSchema).optional(),
  closedBy: z.nativeEnum(UserType).optional(),
  evaluation: z
    .object({
      invited: z.boolean(),
      star: z.number().int().min(1).max(5),
    })
    .partial()
    .optional(),
  message: z
    .object({
      text: z.string(),
      from: z.nativeEnum(UserType),
    })
    .partial()
    .optional(),
  duration: querySchema(z.number()).optional(),
  averageResponseTime: querySchema(z.number()).optional(),
  queued: z.boolean().optional(),
  consultationResult: z.nativeEnum(ConsultationResult).optional(),

  // pagination
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().min(1).max(1000).optional(),
});

export class SearchConversationDto extends createZodDto(
  SearchConversationSchema,
) {}
