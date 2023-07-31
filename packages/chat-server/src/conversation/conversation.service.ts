import { Injectable } from '@nestjs/common';
import AV from 'leancloud-storage';
import { Conversation } from './types';

@Injectable()
export class ConversationService {
  private createConversationObject() {
    return new AV.Object('ChatConversation');
  }

  private createConversationQuery() {
    return new AV.Query('ChatConversation');
  }

  private encodeConversationObject(obj: AV.Object): Conversation {
    return {
      id: obj.id!,
    };
  }

  getConversationForAnonymousCustomer(anonymousId: string) {
    const query = this.createConversationQuery();
    query.equalTo('anonymousId', anonymousId);
    return query.first({ useMasterKey: true }) as Promise<
      AV.Object | undefined
    >;
  }

  async createConversationForAnonymousCustomer(anonymousId: string) {
    const existConv = await this.getConversationForAnonymousCustomer(
      anonymousId,
    );
    if (existConv) {
      return existConv;
    }
    const obj = this.createConversationObject();
    obj.set('anonymousId', anonymousId);
    await obj.save(null, { useMasterKey: true });
    return this.encodeConversationObject(obj);
  }
}
