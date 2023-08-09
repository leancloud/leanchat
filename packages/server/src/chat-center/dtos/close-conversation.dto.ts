import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const CloseConversationSchema = z.object({
  conversationId: z.string(),
});

export class CloseConversationDto extends createZodDto(
  CloseConversationSchema,
) {}
