import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

import { OperatorStatus } from 'src/chat/constants';

const SetStatusSchema = z.object({
  status: z.nativeEnum(OperatorStatus),
});

export class SetStatusDto extends createZodDto(SetStatusSchema) {}
