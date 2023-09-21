import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const CreateMessageSchema = z.object({
  conversationId: z.string(),
  data: z.object({
    text: z.string().optional(),
    file: z
      .object({
        id: z.string(),
      })
      .optional(),
  }),
});

export class CreateMessageDto extends createZodDto(CreateMessageSchema) {}
