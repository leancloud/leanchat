import { MessageBody } from '@nestjs/websockets';
import { ZodSchema } from 'zod';

import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

export const ValidateMessageBody = (schema: ZodSchema) => {
  return MessageBody(new ZodValidationPipe(schema));
};
