import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

import { ObjectIdSchema } from 'src/common/schemas';
import { ConversationStatus } from 'src/chat/constants';

const ListConversationSchema = z
  .object({
    status: z.nativeEnum(ConversationStatus),
    operatorId: ObjectIdSchema.nullable(),
    desc: z.boolean(),
    before: z.coerce.date(),
    after: z.coerce.date(),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(100),
  })
  .partial();

export class ListConversationDto extends createZodDto(ListConversationSchema) {}
