import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';

@Injectable()
export class VisitorChannelService {
  private signSecret: string;

  constructor(configService: ConfigService) {
    this.signSecret = configService.getOrThrow('WIDGET_SIGN_SECRET');
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
