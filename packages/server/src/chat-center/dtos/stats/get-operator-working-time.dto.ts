import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const GetOperatorWorkingTimeSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export class GetOperatorWorkingTimeDto extends createZodDto(
  GetOperatorWorkingTimeSchema,
) {}
