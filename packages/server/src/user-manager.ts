import AV from 'leancloud-storage';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { LRUCache } from 'lru-cache';

const authSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('customer'),
    id: z.string(),
  }),
  z.object({
    type: z.literal('operator'),
    sessionToken: z.string(),
  }),
]);

export interface User {
  id: string;
}

function encodeUser(obj: AV.Object): User {
  return {
    id: obj.get('userId'),
  };
}

export class UserManager {
  private userCache = new LRUCache<string, User>({
    max: 1000,
    ttl: 1000 * 60 * 5,
  });

  async createCustomer() {
    const userId = 'customer_' + nanoid();
    const newCustomer = new AV.Object('ChatUser');
    newCustomer.set('userId', userId);
    await newCustomer.save(null, { useMasterKey: true });
    return encodeUser(newCustomer);
  }

  async getUser(id: string) {
    const cacheValue = this.userCache.get(id);
    if (cacheValue) {
      return cacheValue;
    }

    const query = new AV.Query('ChatUser');
    query.equalTo('userId', id);
    const user = await query.first({ useMasterKey: true });
    if (user) {
      const v = encodeUser(user as AV.Object);
      this.userCache.set(id, v);
      return v;
    }
  }

  async authenticate(data: any) {
    const parseResult = authSchema.safeParse(data);
    if (!parseResult.success) {
      throw new Error('invalid auth');
    }

    const auth = parseResult.data;
    if (auth.type === 'customer') {
      const customer = await this.getUser(auth.id);
      if (!customer) {
        throw new Error('user not found');
      }
      return customer;
    }

    if (auth.type === 'operator') {
      const user = await this.getUser(auth.sessionToken);
      if (!user) {
        throw new Error('user not found');
      }
      return user;
    }

    throw new Error('invalid auth');
  }
}
