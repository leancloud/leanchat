import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

import { ObjectIdSchema } from 'src/common/schemas';

const AssignConversationSchema = z.object({
  operatorId: ObjectIdSchema,
});

export class AssignConversationDto extends createZodDto(
  AssignConversationSchema,
) {}
