import { createZodDto } from 'nestjs-zod';

import { CreateChatbotSchema } from './create-chat-bot.dto';

const UpdateChatbotSchema = CreateChatbotSchema.partial();

export class UpdateChatbotDto extends createZodDto(UpdateChatbotSchema) {}
