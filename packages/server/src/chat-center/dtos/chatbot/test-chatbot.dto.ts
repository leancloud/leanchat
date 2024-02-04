import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const TestChatbotSchema = z.object({
  input: z.string(),
  context: z
    .object({
      questionBaseIds: z.array(z.string()),
      operatorAssigned: z.boolean(),
      data: z.record(z.any()),
    })
    .partial(),
});

export class TestChatbotDto extends createZodDto(TestChatbotSchema) {}
