import { Injectable } from '@nestjs/common';

interface OperatorSession {
  id: string;
  status: string;
  socketIds: Set<string>;
}

@Injectable()
export class OnlineOperatorsService {
  private operators = new Map<string, OperatorSession>();

  online(id: string, socketId: string) {
    const session = this.operators.get(id);
    if (session) {
      session.socketIds.add(socketId);
    } else {
      this.operators.set(id, {
        id,
        status: 'offline',
        socketIds: new Set<string>().add(socketId),
      });
    }
  }

  offline(id: string, socketId: string) {
    const session = this.operators.get(id);
    if (session) {
      session.socketIds.delete(socketId);
      if (session.socketIds.size === 0) {
        this.operators.delete(id);
      }
    }
  }

  get(id: string) {
    return this.operators.get(id);
  }
}
