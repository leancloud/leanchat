import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

import { REDIS } from 'src/redis';
import { Conversation, Operator } from 'src/chat/models';
import { ChatService } from 'src/chat/services';
import { UserType } from 'src/chat/constants';
import { TransferConversationData } from '../interfaces';
import { PushService } from './push.service';

@Injectable()
export class ConversationTransferService {
  @Inject(REDIS)
  private redis: Redis;

  constructor(
    private pushService: PushService,
    private chatService: ChatService,
  ) {}

  async request(
    conversation: Conversation,
    to: Operator,
    currentUser: Operator,
  ) {
    const transferData: TransferConversationData = {
      cid: conversation.id,
      to: to.id,
      by: currentUser.id,
    };
    const key = `transfer:${conversation.id}`;
    await this.redis.set(key, JSON.stringify(transferData), 'EX', 60);
    this.pushService.push({
      to: [to.id],
      event: 'requestConversationTransfer',
      payload: transferData,
    });
  }

  async accept(conversation: Conversation, currentUser: Operator) {
    const key = `transfer:${conversation.id}`;
    const value = await this.redis.get(key);
    if (!value) {
      return;
    }

    const data: TransferConversationData = JSON.parse(value);
    if (currentUser.id !== data.to) {
      return;
    }
    await this.chatService.assignConversation(conversation, currentUser, {
      type: UserType.Operator,
      id: data.by,
    });
    this.pushService.push({
      to: [data.by],
      event: 'acceptConversationTransfer',
      payload: data,
    });
  }
}
