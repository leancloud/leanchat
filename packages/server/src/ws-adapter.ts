import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server } from 'socket.io';

export class WsAdapter extends IoAdapter {
  private middlewares: any[] = [];

  use(middleware: any) {
    this.middlewares.push(middleware);
    return this;
  }

  createIOServer(port: number, options?: any) {
    const server: Server = super.createIOServer(port, options);
    this.middlewares.forEach((middleware) => {
      server.engine.use(middleware);
    });
    return server;
  }
}
