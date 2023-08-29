import { createZodDto } from 'nestjs-zod';

import { CreateQuickReplySchema } from './create-quick-reply.dto';

const UpdateQuickReplySchema = CreateQuickReplySchema.partial();

export class UpdateQuickReplyDto extends createZodDto(UpdateQuickReplySchema) {}
