import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const CurrentOperator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    if (!req.operator) {
      throw new Error(
        'req.operator is undefined, CurrentOperator must be under the AuthGuard',
      );
    }
    return req.operator;
  },
);
