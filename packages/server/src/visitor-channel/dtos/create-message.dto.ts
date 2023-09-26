import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateMessageSchema = z.object({
  text: z.string().optional(),
  fileId: z.string().optional(),
});

export class CreateMessageDto extends createZodDto(CreateMessageSchema) {}
