import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ZodValidationException } from 'nestjs-zod';

@Catch()
export class WsFilter implements ExceptionFilter {
  private readonly logger = new Logger(WsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    let error = 'Internal server error';
    if (exception instanceof WsException) {
      error = exception.message;
    } else if (exception instanceof HttpException) {
      error = exception.message;
    } else if (exception instanceof ZodValidationException) {
      error = exception.message;
    } else {
      this.logger.error(exception);
    }

    const ack = this.getAck(host.getArgs());
    ack?.({ success: false, error });
  }

  getAck(args: any[]) {
    const ack = args[args.length - 1];
    if (typeof ack === 'function') {
      return ack;
    }
  }
}
