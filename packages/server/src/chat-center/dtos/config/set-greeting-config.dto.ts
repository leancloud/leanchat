import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const SetGreetingConfigSchema = z.object({
  enabled: z.boolean(),
  message: z.object({
    text: z.string(),
  }),
});

export class SetGreetingConfigDto extends createZodDto(
  SetGreetingConfigSchema,
) {}
