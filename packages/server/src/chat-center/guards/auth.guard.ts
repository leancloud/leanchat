import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

export class AuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const host = ctx.switchToHttp();
    const req = host.getRequest<Request>();
    if (!req.session.uid) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
