import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { OperatorService } from './operator.service';

@Injectable()
export class CurrentOperatorMiddleware implements NestMiddleware {
  constructor(private operatorService: OperatorService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const uid = req.session.uid;
    if (uid) {
      const operator = await this.operatorService.getOperator(uid);
      (req as any).operator = operator;
    }
    next();
  }
}
