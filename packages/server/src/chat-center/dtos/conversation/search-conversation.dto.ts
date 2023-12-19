import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

import {
  Channel,
  ConsultationResult,
  ConversationStatus,
  UserType,
} from 'src/chat/constants';
import { ObjectIdSchema } from 'src/common/schemas';

function querySchema<T>(schema: z.Schema<T>) {
  return z
    .object({
      gt: schema,
      lt: schema,
    })
    .partial();
}

const SearchConversationSchema = z
  .object({
    id: z.union([ObjectIdSchema, z.array(ObjectIdSchema)]),
    from: z.coerce.date(),
    to: z.coerce.date(),
    status: z.nativeEnum(ConversationStatus),
    channel: z.nativeEnum(Channel),
    categoryId: z.array(ObjectIdSchema),
    visitorId: z.array(ObjectIdSchema),
    operatorId: z.array(ObjectIdSchema),
    closedBy: z.nativeEnum(UserType),
    evaluation: z
      .object({
        invited: z.boolean(),
        star: z.number().int().min(1).max(5),
      })
      .partial(),
    message: z
      .object({
        text: z.string(),
        from: z.nativeEnum(UserType),
      })
      .partial(),
    duration: querySchema(z.number()),
    averageResponseTime: querySchema(z.number()),
    queued: z.boolean(),
    consultationResult: z.nativeEnum(ConsultationResult),

    // pagination
    page: z.number().int().positive(),
    pageSize: z.number().int().min(1).max(1000),

    desc: z.boolean(),
  })
  .partial();

export class SearchConversationDto extends createZodDto(
  SearchConversationSchema,
) {}
