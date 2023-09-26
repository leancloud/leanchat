import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateVisitorSchema = z.object({
  name: z.string().optional(),
  comment: z.string().optional(),
});

export class UpdateVisitorDto extends createZodDto(UpdateVisitorSchema) {}
