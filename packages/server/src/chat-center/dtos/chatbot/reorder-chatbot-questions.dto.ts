import { z } from 'zod';

import { ObjectIdSchema } from 'src/common/schemas';
import { createZodDto } from 'nestjs-zod';

const ReorderChatbotQuestionsSchema = z.object({
  ids: z.array(ObjectIdSchema),
});

export class ReorderChatbotQuestionsDto extends createZodDto(
  ReorderChatbotQuestionsSchema,
) {}
