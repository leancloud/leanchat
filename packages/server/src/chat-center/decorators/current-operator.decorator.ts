import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const CurrentOperator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.operator;
  },
);
