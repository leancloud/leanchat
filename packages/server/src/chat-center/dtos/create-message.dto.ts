import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

import { MessageSchema } from 'src/message/schemas';

const CreateMessageSchema = z.object({
  conversationId: z.string(),
  data: MessageSchema,
});

export class CreateMessageDto extends createZodDto(CreateMessageSchema) {}
