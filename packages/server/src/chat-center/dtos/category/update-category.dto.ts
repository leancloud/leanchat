import { CreateCategorySchema } from './create-category.dto';
import { createZodDto } from 'nestjs-zod';

const UpdateCategorySchema = CreateCategorySchema.partial().omit({
  parentId: true,
});

export class UpdateCategoryDto extends createZodDto(UpdateCategorySchema) {}
