import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';

import { ChatService } from 'src/chat';
import { ConfigService } from 'src/config';

@Injectable()
export class VisitorChannelService {
  private signSecret: string;

  constructor(
    config: NestConfigService,
    private configService: ConfigService,
    private chatService: ChatService,
  ) {
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

  async isBusy() {
    const queueConfig = await this.configService.get('queue');
    if (!queueConfig || queueConfig.capacity === 0) {
      return false;
    }

    const queueLength = await this.chatService.getQueueLength();
    return queueLength > queueConfig.capacity;
  }
}
