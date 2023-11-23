import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const CreateSessionSchema = z
  .object({
    username: z.string(),
    password: z.string(),
    token: z.string(),
  })
  .partial();

export class CreateSessionDto extends createZodDto(CreateSessionSchema) {}
