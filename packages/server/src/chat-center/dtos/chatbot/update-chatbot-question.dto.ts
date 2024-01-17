import { createZodDto } from 'nestjs-zod';

import { CreateChatbotQuestionSchema } from './create-chatbot-question.dto';

const UpdateChatbotQuestionSchema =
  CreateChatbotQuestionSchema.partial().extend({
    nextQuestionBaseId:
      CreateChatbotQuestionSchema.shape.nextQuestionBaseId.nullable(),
  });

export class UpdateChatbotQuestionDto extends createZodDto(
  UpdateChatbotQuestionSchema,
) {}
