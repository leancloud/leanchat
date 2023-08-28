import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateCategorySchema = z.object({
  name: z.string(),
  parentId: z.string().optional(),
});

export class CreateCategoryDto extends createZodDto(CreateCategorySchema) {}
