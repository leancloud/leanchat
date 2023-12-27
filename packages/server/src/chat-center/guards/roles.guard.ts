import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { OperatorRole } from 'src/chat/constants';
import type { Operator } from 'src/chat/models';
import { ALLOWED_ROLES } from '../constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndMerge<OperatorRole[]>(ALLOWED_ROLES, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (roles.length === 0) {
      return true;
    }
    const request = ctx.switchToHttp().getRequest();
    const operator = request.operator as Operator;
    if (!operator) {
      return false;
    }
    return roles.includes(operator.role);
  }
}
