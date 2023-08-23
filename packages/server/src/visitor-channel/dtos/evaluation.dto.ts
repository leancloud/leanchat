import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const EvaluationSchema = z.object({
  star: z.number().int().min(1).max(5),
  feedback: z.string(),
});

export class EvaluationDto extends createZodDto(EvaluationSchema) {}
