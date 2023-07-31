import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Catch()
export class GatewayExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const args = host.getArgs();
    const ack = args[args.length - 1];
    if (ack) {
      if (exception instanceof WsException) {
        ack({ success: false, error: exception.message });
      } else {
        ack({ success: false, error: 'internal error' });
      }
    }
  }
}
