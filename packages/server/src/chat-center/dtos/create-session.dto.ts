import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const CreateSessionSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export class CreateSessionDto extends createZodDto(CreateSessionSchema) {}
