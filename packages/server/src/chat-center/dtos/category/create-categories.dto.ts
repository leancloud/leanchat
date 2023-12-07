import { z } from 'zod';

import { CreateCategorySchema } from './create-category.dto';
import { createZodDto } from 'nestjs-zod';

const CreateCategoriesSchema = z.object({
  data: z.array(CreateCategorySchema).max(100),
});

export class CreateCategoriesDto extends createZodDto(CreateCategoriesSchema) {}
