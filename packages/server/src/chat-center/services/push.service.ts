import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { PushEvent } from '../events';

@Injectable()
export class PushService {
  constructor(private events: EventEmitter2) {}

  push(event: PushEvent) {
    this.events.emit('push', event);
  }
}
