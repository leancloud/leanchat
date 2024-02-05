import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

import { CreateOperatorSchema } from './create-operator.dto';

export const UpdateOperatorSchema = CreateOperatorSchema.omit({
  username: true,
})
  .extend({
    inactive: z.boolean(),
  })
  .partial();

export class UpdateOperatorDto extends createZodDto(UpdateOperatorSchema) {}
