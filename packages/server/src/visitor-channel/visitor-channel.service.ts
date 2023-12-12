import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';

@Injectable()
export class VisitorChannelService {
  private signSecret: string;

  constructor(config: NestConfigService) {
    this.signSecret = config.getOrThrow('LEANCHAT_WIDGET_SIGN_SECRET');
  }

  createToken(visitorId: string) {
    return jwt.sign({ id: visitorId }, this.signSecret, {
      algorithm: 'HS256',
    });
  }

  validateToken(token: string) {
    try {
      return jwt.verify(token, this.signSecret, {
        algorithms: ['HS256'],
      }) as { id: string };
    } catch (err) {
      return false;
    }
  }
}
