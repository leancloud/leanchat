import { createZodDto } from 'nestjs-zod';

import { ObjectIdSchema } from 'src/common/schemas';
import { CreateQuickReplySchema } from './create-quick-reply.dto';

const UpdateQuickReplySchema = CreateQuickReplySchema.extend({
  operatorId: ObjectIdSchema.nullable(),
}).partial();

export class UpdateQuickReplyDto extends createZodDto(UpdateQuickReplySchema) {}
