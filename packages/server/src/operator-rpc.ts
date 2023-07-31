import { z } from 'zod';

import { ConversationManager } from './conversation-manager.js';
import { zodValidation } from './middleware.js';
import { SocketRpc } from './socket-rpc.js';

const listConversationsSchema = z
  .object({
    operatorId: z.string().nullable().optional(),
  })
  .optional();

interface OperatorRpcOptions {
  conversationManager: ConversationManager;
}

export function operatorRpcFactory({ conversationManager }: OperatorRpcOptions) {
  const rpc = new SocketRpc();

  rpc.define('listConversation', zodValidation(listConversationsSchema), (ctx) => {
    return conversationManager.listConversation(ctx.param);
  });

  return rpc;
}
