import { createZodDto } from 'nestjs-zod';

import { CreateOperatorSchema } from './create-operator.dto';

export const UpdateOperatorSchema = CreateOperatorSchema.partial().omit({
  username: true,
});

export class UpdateOperatorDto extends createZodDto(UpdateOperatorSchema) {}
