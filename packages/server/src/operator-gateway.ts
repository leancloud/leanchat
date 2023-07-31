import { Namespace, Socket } from 'socket.io';
import { fromEvent, switchMap } from 'rxjs';
import { Logger } from 'pino';

import { Operator, OperatorManager } from './operator-manager.js';

type GwMiddleware = (socket: Socket, next: (err?: Error) => void) => void;

export class OperatorGateway {
  private operators = new Map<string, Operator>();

  constructor(
    private io: Namespace,
    private operatorManager: OperatorManager,
    private logger: Logger
  ) {
    this.io = io;
    this.operatorManager = operatorManager;
    this.logger = logger;

    io.use(async (socket, next) => {
      const operatorId = socket.handshake.auth.id;
      const operator = await this.operatorManager.getOperator(operatorId);
      if (!operator) {
        return next(new Error('operator not found'));
      }
      socket.data.operator = operator;
      next();
    });

    const connection$ = fromEvent(io, 'connection', (socket: Socket) => {
      const operator = socket.data.operator as Operator;
      return { socket, operator };
    });
    const disconnect$ = connection$.pipe(
      switchMap((ctx) => fromEvent(ctx.socket, 'disconnect', () => ctx))
    );

    connection$.subscribe(({ operator }) => {
      this.logger.debug('operator %s online', operator.id);
    });

    disconnect$.subscribe(({ operator }) => {
      this.operators.delete(operator.id);
      this.logger.debug('operator %s offline', operator.id);
    });
  }

  use(middleware: GwMiddleware) {
    this.io.use(middleware);
  }
}
