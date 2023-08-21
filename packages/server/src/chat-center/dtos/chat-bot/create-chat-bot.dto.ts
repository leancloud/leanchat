import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

import { ChatBotEdgeSchema, ChatBotNodeSchema } from 'src/chat-bot/schemas';

export const CreateChatBotSchema = z.object({
  name: z.string(),
  nodes: z.array(ChatBotNodeSchema),
  edges: z.array(ChatBotEdgeSchema),
});

export class CreateChatBotDto extends createZodDto(CreateChatBotSchema) {}
