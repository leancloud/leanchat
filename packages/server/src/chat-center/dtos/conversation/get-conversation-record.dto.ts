import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

import { BooleanStringSchema, ObjectIdSchema } from 'src/common/schemas';
import { Channel, ConsultationResult, UserType } from 'src/chat/constants';

const NumberConditionSchema = z
  .string()
  .regex(/^[<>]\d+$/)
  .transform((s) => {
    const op = s.charAt(0);
    const num = s.slice(1);
    return op === '<' ? { lt: parseInt(num) } : { gt: parseInt(num) };
  });

const GetConversationRecordSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  channel: z
    .preprocess((v: string) => parseInt(v), z.nativeEnum(Channel))
    .optional(),
  visitorId: ObjectIdSchema.optional(),
  operatorId: ObjectIdSchema.optional(),
  messageKeyword: z.string().optional(),
  messageFrom: z
    .preprocess((v: string) => parseInt(v), z.nativeEnum(UserType))
    .optional(),
  duration: NumberConditionSchema.optional(),
  averageResponseTime: NumberConditionSchema.optional(),
  evaluationStar: z.coerce.number().int().min(1).max(5).optional(),
  queued: BooleanStringSchema.optional(),
  closedBy: z
    .preprocess((v: string) => parseInt(v), z.nativeEnum(UserType))
    .optional(),
  consultationResult: z
    .preprocess((v: string) => parseInt(v), z.nativeEnum(ConsultationResult))
    .optional(),
  categoryId: ObjectIdSchema.optional(),
  page: z.coerce.number().positive().optional(),
  pageSize: z.coerce.number().min(1).max(1000).optional(),
});

export class GetConversationRecordDto extends createZodDto(
  GetConversationRecordSchema,
) {}
