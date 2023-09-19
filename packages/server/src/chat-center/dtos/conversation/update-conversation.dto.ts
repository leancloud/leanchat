import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ObjectIdSchema } from 'src/common/schemas';

const UpdateConversationSchema = z.object({
  categoryId: ObjectIdSchema.optional(),
});

export class UpdateConversationDto extends createZodDto(
  UpdateConversationSchema,
) {}
