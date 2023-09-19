import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const CreateMessageSchema = z.object({
  conversationId: z.string(),
  data: z.object({
    text: z.string(),
  }),
});

export class CreateMessageDto extends createZodDto(CreateMessageSchema) {}
