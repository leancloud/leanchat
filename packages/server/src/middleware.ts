import { ZodSchema } from 'zod';

import { RpcError, RpcMiddleware } from './socket-rpc.js';

export function zodValidation(schema: ZodSchema): RpcMiddleware {
  return (ctx, next) => {
    const parseResult = schema.safeParse(ctx.param);
    if (!parseResult.success) {
      const message = parseResult.error.errors
        .map((error) => `${error.path.join('.') || 'param'}: ${error.message}`)
        .join(', ');
      throw new RpcError(message);
    }
    ctx.param = parseResult.data;
    return next();
  };
}
