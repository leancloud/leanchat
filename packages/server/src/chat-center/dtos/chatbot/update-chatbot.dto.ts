import { createZodDto } from 'nestjs-zod';

import { CreateChatbotSchema } from './create-chatbot.dto';

const UpdateChatbotSchema = CreateChatbotSchema.extend({
  acceptRule: CreateChatbotSchema.shape.acceptRule.nullable(),
}).partial();

export class UpdateChatbotDto extends createZodDto(UpdateChatbotSchema) {}
