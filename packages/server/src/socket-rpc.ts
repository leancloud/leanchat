import { Server, Socket } from 'socket.io';
import compose, { ComposedMiddleware } from 'koa-compose';

export interface RpcContext {
  socket: Socket;
  param: any;
}

export type RpcNext = () => Promise<any>;

export type RpcMiddleware = (ctx: RpcContext, next: RpcNext) => any;

export type RpcResponse =
  | {
      ok: true;
      result: any;
    }
  | {
      ok: false;
      error: string;
    };

export class RpcError extends Error {}

async function errorMiddleware(_ctx: RpcContext, next: RpcNext): Promise<RpcResponse> {
  try {
    const result = await next();
    return { ok: true, result };
  } catch (error) {
    if (error instanceof RpcError) {
      return { ok: false, error: error.message };
    }
    console.error(error);
    return { ok: false, error: 'Internal server error' };
  }
}

interface SocketRpcOptions {
  io: Server;
  prefix?: string;
}

export class SocketRpc {
  readonly io: Server;
  readonly prefix: string;

  private endpoints = new Map<string, ComposedMiddleware<RpcContext>>();

  constructor({ io, prefix }: SocketRpcOptions) {
    this.io = io;
    this.prefix = prefix || '';

    io.on('connection', (socket) => {
      this.endpoints.forEach((handler, name) => {
        socket.on(name, async (...args) => {
          let cb: ((res: any) => void) | undefined;
          if (args.length && typeof args[args.length - 1] === 'function') {
            cb = args[args.length - 1];
            args = args.slice(0, args.length - 1);
          }
          const res = await handler({ socket, param: args[0] });
          cb?.(res);
        });
      });
    });
  }

  define(name: string, ...middlewares: RpcMiddleware[]) {
    this.endpoints.set(this.prefix + name, compose([errorMiddleware, ...middlewares]));
  }

  getEndpoints() {
    return [...this.endpoints.keys()];
  }
}
