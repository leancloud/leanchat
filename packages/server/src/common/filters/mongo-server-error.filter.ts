import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { mongo } from 'mongoose';

@Catch(mongo.MongoServerError)
export class MongoServerErrorFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(error: mongo.MongoServerError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const { httpAdapter } = this.httpAdapterHost;
    const responseBody = {
      message: `MongoServerError: ${error.message}`,
    };

    // https://www.mongodb.com/docs/manual/reference/error-codes/
    switch (error.code) {
      case 50:
        responseBody.message = '查询超时';
        break;
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, 400);
  }
}
