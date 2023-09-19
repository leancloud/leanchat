import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const SetStatusSchema = z.object({
  status: z.enum(['ready', 'busy', 'leave']),
});

export class SetStatusDto extends createZodDto(SetStatusSchema) {}
