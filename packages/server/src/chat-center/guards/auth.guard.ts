import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { OperatorService } from 'src/chat/services';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private operatorService: OperatorService) {}

  async canActivate(ctx: ExecutionContext) {
    const host = ctx.switchToHttp();
    const req = host.getRequest<Request>();
    if (!req.session.uid) {
      throw new UnauthorizedException();
    }
    const operator = await this.operatorService.getOperator(req.session.uid);
    if (!operator) {
      throw new UnauthorizedException();
    }
    if (operator.inactive) {
      throw new ForbiddenException('当前账户已被禁用');
    }
    (req as any).operator = operator;
    return true;
  }
}
