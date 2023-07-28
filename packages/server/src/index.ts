import http from 'node:http';
import AV from 'leancloud-storage';
import Koa from 'koa';
import serve from 'koa-static';
import send from 'koa-send';
import Router from 'koa-router';
import { Server } from 'socket.io';
import { pino } from 'pino';
import 'dotenv/config';

import { SocketRpc } from './socket-rpc.js';
import { registerConversationRpc } from './conversation.js';
import { registerMessageRpc } from './message.js';
import { Gateway } from './gateway.js';
import { UserManager } from './user-manager.js';

AV.init({
  appId: process.env.LEANCLOUD_APP_ID!,
  appKey: process.env.LEANCLOUD_APP_KEY!,
  masterKey: process.env.LEANCLOUD_APP_MASTER_KEY!,
  serverURL: process.env.LEANCLOUD_API_SERVER!,
});

(AV as any)._config.disableCurrentUser = true;

const logger = pino({
  level: 'debug',
});

const app = new Koa();
const httpServer = http.createServer(app.callback());
const io = new Server(httpServer);
const userManager = new UserManager();
const gateway = new Gateway({ io, logger, userManager });
const rpc = new SocketRpc({ io });

const router = new Router({ prefix: '/api/v1' });

app.use(router.routes());
app.use(serve('public'));
app.use(async (ctx) => {
  await send(ctx, 'index.html', { root: 'public' });
});

registerConversationRpc(rpc);
registerMessageRpc(rpc);

router.post('/customers', async (ctx) => {
  const customer = await userManager.createCustomer();
  ctx.body = customer;
});

httpServer.listen(3000, () => {
  rpc.getEndpoints().forEach((endpoint) => {
    console.log(`[Socket RPC] ${endpoint}`);
  });
  console.log('Server launched');
});
