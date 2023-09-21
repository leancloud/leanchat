import { Global, Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import AV from 'leancloud-storage';

import { LeanCloudService } from './leancloud.service';

@Global()
@Module({
  providers: [LeanCloudService],
  exports: [LeanCloudService],
})
export class LeanCloudModule implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const appId = this.configService.getOrThrow<string>('LEANCLOUD_APP_ID');
    const appKey = this.configService.getOrThrow<string>('LEANCLOUD_APP_KEY');
    const masterKey = this.configService.getOrThrow<string>(
      'LEANCLOUD_APP_MASTER_KEY',
    );
    const apiServer = this.configService.getOrThrow<string>(
      'LEANCLOUD_API_SERVER',
    );

    AV.init({
      appId,
      appKey,
      masterKey,
      serverURL: apiServer,
    });
  }
}
