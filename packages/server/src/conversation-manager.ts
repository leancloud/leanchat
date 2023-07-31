import AV from 'leancloud-storage';
import { RpcError } from './socket-rpc.js';
import { Message } from './message.type.js';

export interface Conversation {
  id: string;
  customerId: string;
  operatorId?: string;
  recentMessage?: {
    text: string;
  };
  createTime: number;
}

interface ListConversationOptons {
  operatorId?: string | null;
}

function encodeConversation(obj: AV.Object): Conversation {
  return {
    id: obj.id!,
    customerId: obj.get('customerId'),
    operatorId: obj.get('operatorId'),
    recentMessage: obj.get('recentMessage'),
    createTime: obj.createdAt!.getTime(),
  };
}

export class ConversationManager {
  createConversationObject() {
    return new AV.Object('ChatConversation');
  }

  createConversationQuery() {
    return new AV.Query('ChatConversation');
  }

  getConversationForCustomer(customerId: string) {
    return this.createConversationQuery()
      .equalTo('customerId', customerId)
      .addDescending('createdAt')
      .first({ useMasterKey: true }) as Promise<AV.Object | undefined>;
  }

  async createConversation(customerId: string) {
    const existConvObj = await this.getConversationForCustomer(customerId);
    if (existConvObj) {
      return encodeConversation(existConvObj);
    }

    const obj = this.createConversationObject();
    obj.set('customerId', customerId);
    await obj.save(null, { useMasterKey: true });
    return encodeConversation(obj);
  }

  async listConversation({ operatorId }: ListConversationOptons) {
    const query = new AV.Query('ChatConversation');
    if (operatorId) {
      query.equalTo('operatorId', operatorId);
    }
    if (operatorId === null) {
      query.doesNotExist('operatorId');
    }
    query.addAscending('createdAt');
    const objs = await query.find({ useMasterKey: true });
    return objs.map((obj) => encodeConversation(obj as AV.Object));
  }

  private async getConversationObject(id: string) {
    const query = this.createConversationQuery();
    query.equalTo('objectId', id);
    return query.first({ useMasterKey: true }) as Promise<AV.Object | undefined>;
  }

  async assignConversation(convId: string, operatorId: string) {
    const obj = await this.getConversationObject(convId);
    if (!obj) {
      throw new RpcError(`conversation ${convId} does not exist`);
    }
    if (obj.has('operatorId')) {
      throw new RpcError(`conversation ${convId} already assigned`);
    }

    obj.set('operatorId', operatorId);

    const saveQuery = new AV.Query('_').doesNotExist('operatorId');
    try {
      await obj.save(null, {
        useMasterKey: true,
        query: saveQuery,
      } as any);
      return encodeConversation(obj);
    } catch (error) {
      if ((error as any).code === 305) {
        throw new RpcError(`conversation ${convId} already assigned`);
      }
      throw error;
    }
  }

  createTimelineObject() {
    return new AV.Object('ChatTimeline');
  }

  encodeMessage(obj: AV.Object): Message {
    const data = obj.get('data');
    return {
      id: obj.id!,
      cid: obj.get('cid'),
      uid: data.uid,
      text: data.text,
      createTime: obj.createdAt!.getTime(),
    };
  }

  async persistMessage(cid: string, uid: string, text: string) {
    const obj = this.createTimelineObject();
    obj.set('type', 'message');
    obj.set('cid', cid);
    obj.set('data', { uid, text });
    await obj.save(null, { useMasterKey: true });
    return this.encodeMessage(obj);
  }
}
