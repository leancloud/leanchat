import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateChatbotQuestionBaseSchema = z.object({
  name: z.string().optional(),
});

export class UpdateChatbotQuestionBaseDto extends createZodDto(
  UpdateChatbotQuestionBaseSchema,
) {}
