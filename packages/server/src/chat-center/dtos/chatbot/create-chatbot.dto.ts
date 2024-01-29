import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

import { ChatbotAcceptRule } from 'src/chat/constants';
import { ObjectIdSchema } from 'src/common/schemas';
import { MessageSchema } from './schemas';

const MsOffsetSchema = z
  .number()
  .int()
  .min(0)
  .max(24 * 60 * 60 * 1000);

const WorkingTimeSchema = z.object({
  start: MsOffsetSchema,
  end: MsOffsetSchema,
});

export const CreateChatbotSchema = z.object({
  name: z.string(),
  acceptRule: z.nativeEnum(ChatbotAcceptRule).optional(),
  workingTime: WorkingTimeSchema.optional(),
  globalQuestionBaseIds: z.array(ObjectIdSchema).optional(),
  initialQuestionBaseIds: z.array(ObjectIdSchema).optional(),
  greetingMessage: MessageSchema,
  noMatchMessage: MessageSchema,
});

export class CreateChatbotDto extends createZodDto(CreateChatbotSchema) {}
