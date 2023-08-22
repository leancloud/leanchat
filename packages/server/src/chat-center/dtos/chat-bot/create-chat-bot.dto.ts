import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

import { ChatbotEdgeSchema, ChatbotNodeSchema } from 'src/chatbot/schemas';

export const CreateChatbotSchema = z.object({
  name: z.string(),
  nodes: z.array(ChatbotNodeSchema),
  edges: z.array(ChatbotEdgeSchema),
});

export class CreateChatbotDto extends createZodDto(CreateChatbotSchema) {}
