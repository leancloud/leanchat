import { createZodDto } from 'nestjs-zod';

import { CreateChatBotSchema } from './create-chat-bot.dto';

const UpdateChatBotSchema = CreateChatBotSchema.partial();

export class UpdateChatBotDto extends createZodDto(UpdateChatBotSchema) {}
