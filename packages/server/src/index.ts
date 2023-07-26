import http from 'node:http';
import AV from 'leancloud-storage';
import { Server } from 'socket.io';
import { z } from 'zod';
import 'dotenv/config';

import { SocketRpc } from './socket-rpc';
import { registerConversationRpc } from './conversation';
import { registerMessageRpc } from './message';

AV.init({
  appId: process.env.LEANCLOUD_APP_ID!,
  appKey: process.env.LEANCLOUD_APP_KEY!,
  masterKey: process.env.LEANCLOUD_APP_MASTER_KEY!,
  serverURL: process.env.LEANCLOUD_API_SERVER!,
});

(AV as any)._config.disableCurrentUser = true;

const httpServer = http.createServer();
const io = new Server(httpServer);
const rpc = new SocketRpc(io);

const ioAuthSchema = z.object({
  type: z.enum(['operator']).optional(),
  sessionToken: z.string(),
});

io.use(async (socket, next) => {
  const parseResult = ioAuthSchema.safeParse(socket.handshake.auth);
  if (!parseResult.success) {
    return next(new Error('invalid auth'));
  }

  const auth = parseResult.data;

  try {
    const user = await AV.User.become(auth.sessionToken);
    socket.data = {
      type: auth.type,
      uid: user.id,
    };
  } catch (error) {
    console.error(error);
    return next(new Error('login falied'));
  }

  next();
});

io.on('connection', (socket) => {
  if (socket.data.type === 'operator') {
    socket.join('operator');
  }
});

registerConversationRpc(rpc);
registerMessageRpc(rpc);

httpServer.listen(3000, () => {
  rpc.getEndpoints().forEach((endpoint) => {
    console.log(`[Socket RPC] ${endpoint}`);
  });
  console.log('Server launched');
});
