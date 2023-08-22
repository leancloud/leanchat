import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { MessageSchema } from 'src/message/schemas';

const CreateMessageSchema = z.object({
  data: MessageSchema,
});

export class CreateMessageDto extends createZodDto(CreateMessageSchema) {}
