import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

import { OperatorRole } from 'src/chat/constants';

export const CreateOperatorSchema = z.object({
  username: z
    .string()
    .min(6)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6).max(64),
  role: z.nativeEnum(OperatorRole),
  externalName: z.string().max(16),
  internalName: z.string().max(16),
  concurrency: z.number().int().min(0),
});

export class CreateOperatorDto extends createZodDto(CreateOperatorSchema) {}
