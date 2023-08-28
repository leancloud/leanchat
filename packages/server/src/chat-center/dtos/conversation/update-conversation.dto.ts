import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateConversationSchema = z.object({
  categoryId: z.string(),
});

export class UpdateConversationDto extends createZodDto(
  UpdateConversationSchema,
) {}
