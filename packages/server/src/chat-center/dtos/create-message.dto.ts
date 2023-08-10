import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const CreateMessageSchema = z.object({
  conversationId: z.string(),
  content: z.string(),
});

export class CreateMessageDto extends createZodDto(CreateMessageSchema) {}
