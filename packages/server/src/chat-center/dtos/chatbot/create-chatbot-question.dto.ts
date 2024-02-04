import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

import { ObjectIdSchema } from 'src/common/schemas';
import { ChatbotQuestionMatcher } from 'src/chat/constants';
import { MessageSchema } from './schemas';

export const CreateChatbotQuestionSchema = z.object({
  matcher: z.nativeEnum(ChatbotQuestionMatcher),
  question: z.string(),
  similarQuestions: z.array(z.string()).optional(),
  answer: MessageSchema,
  nextQuestionBaseId: ObjectIdSchema.optional(),
  assignOperator: z.boolean().optional(),
  code: z.string().optional(),
});

export class CreateChatbotQuestionDto extends createZodDto(
  CreateChatbotQuestionSchema,
) {}
