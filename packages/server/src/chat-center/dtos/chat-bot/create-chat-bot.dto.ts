import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

import { ChatBotNodeSchema } from 'src/chat-bot/schemas';

const CreateChatBotSchema = z.object({
  name: z.string(),
  nodes: z.array(ChatBotNodeSchema),
});

export class CreateChatBotDto extends createZodDto(CreateChatBotSchema) {}
