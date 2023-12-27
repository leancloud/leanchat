import { createZodDto } from 'nestjs-zod';

import { CreateOperatorGroupSchema } from './create-operator-group.dto';

const UpdateOperatorGroupSchema = CreateOperatorGroupSchema.partial();

export class UpdateOperatorGroupDto extends createZodDto(
  UpdateOperatorGroupSchema,
) {}
