import http from 'node:http';
import { EventEmitter } from 'node:events';
import AV from 'leancloud-storage';
import Koa from 'koa';
import serve from 'koa-static';
import send from 'koa-send';
import Router from 'koa-router';
import { Server } from 'socket.io';
import { pino } from 'pino';
import 'dotenv/config';

import { CustomerManager } from './customer-manager.js';
import { ConversationManager } from './conversation-manager.js';
import { OperatorGateway } from './operator-gateway.js';
import { operatorRpcFactory } from './operator-rpc.js';
import { OperatorManager } from './operator-manager.js';
import { CustomerGateway } from './customer-gateway.js';
import { CustomerChannelWs } from './customer-channel-ws.js';

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

const events = new EventEmitter();

const customerManager = new CustomerManager();
const operatorManager = new OperatorManager();
const conversationManager = new ConversationManager();

const customerNamespace = io.of('/customers');
const customerGateway = new CustomerGateway(events, conversationManager, logger);
const customerChannelWs = new CustomerChannelWs(
  customerNamespace,
  events,
  customerManager,
  customerGateway,
  logger
);

const operatorNamespace = io.of('/operators');
const operatorGateway = new OperatorGateway(operatorNamespace, operatorManager, logger);

const router = new Router({ prefix: '/api/v1' });

app.use(router.routes());
app.use(serve('public'));
app.use(async (ctx) => {
  await send(ctx, 'index.html', { root: 'public' });
});

const operatorRpc = operatorRpcFactory({ conversationManager });
operatorGateway.use(operatorRpc.middleware());

router.post('/customers', async (ctx) => {
  const customer = await customerManager.createCustomer();
  ctx.body = customer;
});

httpServer.listen(3000, () => {
  console.log('Server launched');
});
