import AV from 'leancloud-storage';
import { z } from 'zod';

import { zodValidation } from './middleware.js';
import { RpcError, SocketRpc } from './socket-rpc.js';
import { getConversation } from './conversation.js';

export interface Message {
  id: string;
  cid: string;
  uid: string;
  text: string;
  createTime: number;
}

export function encodeMessage(obj: AV.Object): Message {
  const data = obj.get('data');
  return {
    id: obj.id!,
    cid: obj.get('cid'),
    uid: data.uid,
    text: data.text,
    createTime: obj.createdAt!.getTime(),
  };
}

const sendMessageSchema = z.object({
  cid: z.string(),
  text: z.string(),
});

const getTimelineSchema = z.object({
  cid: z.string(),
  type: z
    .array(z.enum(['message']))
    .min(1)
    .optional(),
  count: z.number().min(1).max(1000).optional(),
  cursor: z.number().optional(),
  desc: z.boolean().optional(),
});

export function registerMessageRpc(rpc: SocketRpc) {
  rpc.define('sendMessage', zodValidation(sendMessageSchema), async (ctx) => {
    const { cid, text } = ctx.param as z.infer<typeof sendMessageSchema>;
    const { uid } = ctx.socket.data;

    const convObj = await getConversation(cid);
    if (!convObj) {
      throw new RpcError(`Conversation ${cid} does not exist`);
    }

    const msgObj = new AV.Object('ChatTimeline');
    msgObj.set('cid', cid);
    msgObj.set('type', 'message');
    msgObj.set('data', { uid, text });
    await msgObj.save(null, { useMasterKey: true });

    const msg = encodeMessage(msgObj);

    convObj.set('recentMessage', msg);
    await convObj.save(null, { useMasterKey: true });

    ctx.socket.broadcast.to(`conv:${cid}`).emit('message', msg);

    return msg;
  });

  rpc.define('getTimeline', zodValidation(getTimelineSchema), async (ctx) => {
    const param = ctx.param as z.infer<typeof getTimelineSchema>;

    const query = new AV.Query('ChatTimeline');
    query.equalTo('cid', param.cid);
    if (param.type) {
      query.containedIn('type', param.type);
    }
    if (param.cursor) {
      query.greaterThan('createdAt', new Date(param.cursor));
    }
    if (param.count) {
      query.limit(param.count);
    }
    if (param.desc) {
      query.addDescending('createdAt');
    } else {
      query.addAscending('createdAt');
    }

    const objects = (await query.find({ useMasterKey: true })) as AV.Object[];
    return objects.map(encodeMessage);
  });
}
