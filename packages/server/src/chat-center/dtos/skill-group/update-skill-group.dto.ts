import { createZodDto } from 'nestjs-zod';

import { CreateSkillGroupSchema } from './create-skill-group.dto';

const UpdateSkillGroupSchema = CreateSkillGroupSchema.partial();

export class UpdateSkillGroupDto extends createZodDto(UpdateSkillGroupSchema) {}
