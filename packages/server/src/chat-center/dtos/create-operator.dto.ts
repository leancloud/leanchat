import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const CreateOperatorSchema = z.object({
  username: z
    .string()
    .min(6)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6).max(64),
  externalName: z.string().max(16),
  internalName: z.string().max(16),
  concurrency: z.number().int().min(0),
});

export class CreateOperatorDto extends createZodDto(CreateOperatorSchema) {}
