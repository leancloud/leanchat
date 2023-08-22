import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const InviteEvaluationSchema = z.object({
  conversationId: z.string(),
});

export class InviteEvaluationDto extends createZodDto(InviteEvaluationSchema) {}
