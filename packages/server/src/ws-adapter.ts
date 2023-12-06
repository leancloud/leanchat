import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class WsAdapter extends IoAdapter {
  private middlewares: any[] = [];
  private adapterConstructor: ReturnType<typeof createAdapter>;

  use(middleware: any) {
    this.middlewares.push(middleware);
    return this;
  }

  async connectToRedis(url?: string) {
    const pubClient = createClient({ url });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server: Server = super.createIOServer(port, options);
    this.middlewares.forEach((middleware) => {
      server.engine.use(middleware);
    });
    server.adapter(this.adapterConstructor);
    return server;
  }
}
