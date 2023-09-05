import { createZodDto } from 'nestjs-zod';

import { CreateCategorySchema } from './create-category.dto';

const UpdateCategorySchema = CreateCategorySchema.partial().omit({
  parentId: true,
});

export class UpdateCategoryDto extends createZodDto(UpdateCategorySchema) {}
