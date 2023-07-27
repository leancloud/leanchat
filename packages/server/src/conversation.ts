import AV from 'leancloud-storage';
import { z } from 'zod';

import { RpcError, SocketRpc } from './socket-rpc.js';
import { zodValidation } from './middleware.js';
import { Cache, MemoryStore } from './cache.js';

export interface Conversation {
  id: string;
  creator: {
    id: string;
  };
  assignee: {
    id: string;
  };
  recentMessage?: {
    text: string;
  };
  createTime: number;
}

export function encodeConversation(obj: AV.Object): Conversation {
  return {
    id: obj.id!,
    creator: obj.get('creator'),
    assignee: obj.get('assignee'),
    recentMessage: obj.get('recentMessage'),
    createTime: obj.createdAt!.getTime(),
  };
}

export function getConversation(id: string) {
  const query = new AV.Query('ChatConversation');
  query.equalTo('objectId', id);
  return query.first({ useMasterKey: true }) as Promise<AV.Object | undefined>;
}

interface CreateConversationData {
  creator: {
    id: string;
  };
}

export async function createConversation(data: CreateConversationData): Promise<Conversation> {
  const obj = new AV.Object('ChatConversation');
  obj.set('creator', data.creator);
  await obj.save({}, { useMasterKey: true });
  return encodeConversation(obj);
}

interface GetConversationsOptions {
  assigneeId?: string | null;
  isSolved?: boolean;
}

export async function getConversations(options: GetConversationsOptions): Promise<Conversation[]> {
  const query = new AV.Query('ChatConversation');

  if (options.assigneeId === null) {
    query.doesNotExist('assignee');
  }
  if (options.assigneeId) {
    query.equalTo('assignee.id', options.assigneeId);
  }
  if (options.isSolved === true) {
    query.equalTo('isSolved', true);
  }
  if (options.isSolved === false) {
    query.doesNotExist('isSolved');
  }

  query.addDescending('createdAt');

  const objs = await query.find({ useMasterKey: true });
  return objs.map((obj) => encodeConversation(obj as AV.Object));
}

export async function joinConversation(uid: string, cid: string) {
  const conv = (await new AV.Query('ChatConversation')
    .equalTo('objectId', cid)
    .first({ useMasterKey: true })) as AV.Object;
  if (!conv) {
    throw new RpcError(`Conversation ${cid} does not exist`);
  }

  if (conv.has('assignee')) {
    throw new RpcError(`Conversation ${cid} already assigned`);
  }

  conv.set('assignee', { id: uid });

  const saveQuery = new AV.Query('ChatConversation');
  saveQuery.doesNotExist('assignee');

  await conv.save(null, {
    useMasterKey: true,
    query: saveQuery,
  } as any);

  return encodeConversation(conv);
}

function getUnassignedConversationCount() {
  const query = new AV.Query('ChatConversation');
  query.doesNotExist('assignee');
  return query.count({ useMasterKey: true });
}

const unassignedCountCache = new Cache({
  store: new MemoryStore<number>(1000 * 60 * 5),
  fetch: getUnassignedConversationCount,
});

const getConversationsSchema = z
  .object({
    assigneeId: z.string().nullable().optional(),
    isSolved: z.boolean().optional(),
  })
  .optional();

export function registerConversationRpc(rpc: SocketRpc) {
  rpc.define('createConversation', async (ctx) => {
    const { uid } = ctx.socket.data;
    const conv = await createConversation({
      creator: {
        id: uid,
      },
    });

    setImmediate(async () => {
      unassignedCountCache.store.inc();
      const count = await unassignedCountCache.get();
      rpc.io.to('operator').emit('unassignedCountChanged', count);
    });

    return conv;
  });

  rpc.define('getConversations', zodValidation(getConversationsSchema), (ctx) => {
    return getConversations(ctx.param);
  });

  rpc.define('subscribeConversation', zodValidation(z.string()), (ctx) => {
    const cid = ctx.param as string;
    ctx.socket.join(`conv:${cid}`);
  });

  rpc.define('unsubscribeConversation', zodValidation(z.string()), (ctx) => {
    const cid = ctx.param as string;
    ctx.socket.leave(`conv:${cid}`);
  });

  rpc.define('joinConversation', zodValidation(z.string()), async (ctx) => {
    const cid = ctx.param as string;
    const conv = await joinConversation(ctx.socket.data.uid, cid);
    ctx.socket.to('operator').emit('conversation:assigned', conv);
    unassignedCountCache.store.inc(-1);
  });

  rpc.define('subscribeUnassignedCount', (ctx) => {
    return unassignedCountCache.get();
  });
}
