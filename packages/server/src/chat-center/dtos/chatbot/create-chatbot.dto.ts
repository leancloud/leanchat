import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

import { ChatbotAcceptRule } from 'src/chat/constants';
import { ObjectIdSchema } from 'src/common/schemas';
import { MessageSchema } from './schemas';

export const CreateChatbotSchema = z.object({
  name: z.string(),
  acceptRule: z.nativeEnum(ChatbotAcceptRule).optional(),
  globalQuestionBaseIds: z.array(ObjectIdSchema).optional(),
  initialQuestionBaseIds: z.array(ObjectIdSchema).optional(),
  greetingMessage: MessageSchema,
  noMatchMessage: MessageSchema,
});

export class CreateChatbotDto extends createZodDto(CreateChatbotSchema) {}
