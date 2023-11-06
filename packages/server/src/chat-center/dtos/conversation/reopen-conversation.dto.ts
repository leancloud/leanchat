import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ObjectIdSchema } from 'src/common/schemas';

const ReopenConversationSchema = z.object({
  conversationId: ObjectIdSchema,
});

export class ReopenConversationDto extends createZodDto(
  ReopenConversationSchema,
) {}
