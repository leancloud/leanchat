import { Server, Socket } from 'socket.io';
import { Logger } from 'pino';

import { UserManager } from './user-manager.js';

interface Session {
  uid: string;
  socket: Socket;
}

interface GatewayOptions {
  io: Server;
  logger: Logger;
  userManager: UserManager;
}

export class Gateway {
  readonly io: Server;
  readonly logger: Logger;
  private userManager: UserManager;

  private clients = new Map<string, Session>();

  constructor({ io, logger, userManager }: GatewayOptions) {
    this.io = io;
    this.logger = logger;
    this.userManager = userManager;

    io.use(async (socket, next) => {
      try {
        await this.authenticate(socket);
        next();
      } catch (error) {
        this.logger.debug('auth failed %o', socket.handshake.auth);
        next(error as Error);
      }
    });
  }

  async authenticate(socket: Socket) {
    const user = await this.userManager.authenticate(socket.handshake.auth);
    socket.on('disconnect', () => {
      this.clients.delete(user.id);
      this.logger.debug('user offline %s', user.id);
    });
    socket.data = {
      uid: user.id,
    };
    this.clients.set(user.id, {
      uid: user.id,
      socket,
    });
    this.logger.debug('user online %s', user.id);

    // TODO: remove this -.-
    if (user.id.startsWith('operator_')) {
      socket.join('operator');
    }
  }
}
