import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const TestChatbotSchema = z.object({
  input: z.string(),
  context: z
    .object({
      questionBaseIds: z.array(z.string()),
      operatorAssigned: z.boolean(),
    })
    .partial(),
});

export class TestChatbotDto extends createZodDto(TestChatbotSchema) {}
