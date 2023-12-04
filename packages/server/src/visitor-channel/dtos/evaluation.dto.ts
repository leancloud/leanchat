import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const EvaluationSchema = z.object({
  star: z.number().int().min(1).max(5),
  feedback: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export class EvaluationDto extends createZodDto(EvaluationSchema) {}
