import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateChatbotQuestionBaseSchema = z.object({
  name: z.string(),
});

export class CreateChatbotQuestionBaseDto extends createZodDto(
  CreateChatbotQuestionBaseSchema,
) {}
