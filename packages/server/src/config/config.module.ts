import { TypegooseModule } from '@m8a/nestjs-typegoose';
import { Global, Module } from '@nestjs/common';

import { Config } from './config.model';
import { ConfigService } from './config.service';

@Global()
@Module({
  imports: [TypegooseModule.forFeature([Config])],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
