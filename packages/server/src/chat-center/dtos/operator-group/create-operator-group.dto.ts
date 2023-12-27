import { z } from 'zod';

import { ObjectIdSchema } from 'src/common/schemas';
import { createZodDto } from 'nestjs-zod';

export const CreateOperatorGroupSchema = z.object({
  name: z.string(),
  operatorIds: z.array(ObjectIdSchema).max(100).optional(),
});

export class CreateOperatorGroupDto extends createZodDto(
  CreateOperatorGroupSchema,
) {}
