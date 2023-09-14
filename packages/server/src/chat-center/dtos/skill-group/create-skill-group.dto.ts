import { createZodDto } from 'nestjs-zod';
import { ObjectIdSchema } from 'src/common/schemas';
import { z } from 'zod';

export const CreateSkillGroupSchema = z.object({
  name: z.string().nonempty(),
  memberIds: z.array(ObjectIdSchema).optional(),
});

export class CreateSkillGroupDto extends createZodDto(CreateSkillGroupSchema) {}
