import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import _ from 'lodash';

export const CreateQuickReplySchema = z.object({
  content: z.string(),
  tags: z.array(z.string()).transform(_.uniq).optional(),
});

export class CreateQuickReplyDto extends createZodDto(CreateQuickReplySchema) {}
