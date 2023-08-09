import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const AssignConversationSchema = z.object({
  conversationId: z.string(),
  operatorId: z.string(),
});

export class AssignConversationDto extends createZodDto(
  AssignConversationSchema,
) {}
