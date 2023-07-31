import AV from 'leancloud-storage';
import { z } from 'zod';

import { SocketRpc } from './socket-rpc.js';
import { zodValidation } from './middleware.js';
import { ConversationManager } from './conversation-manager.js';

export function getConversation(id: string) {
  const query = new AV.Query('ChatConversation');
  query.equalTo('objectId', id);
  return query.first({ useMasterKey: true }) as Promise<AV.Object | undefined>;
}

const listConversationsSchema = z
  .object({
    operatorId: z.string().nullable().optional(),
  })
  .optional();

export function registerConversationRpc(rpc: SocketRpc, convManager: ConversationManager) {
  rpc.define('createConversation', async (ctx) => {
    const { uid } = ctx.socket.data;
    const conv = await convManager.createConversation(uid);
    return conv;
  });

  rpc.define('listConversation', zodValidation(listConversationsSchema), (ctx) => {
    return convManager.listConversation(ctx.param);
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
    const { uid } = ctx.socket.data;
    const cid = ctx.param as string;
    await convManager.assignConversation(cid, uid);
  });
}
