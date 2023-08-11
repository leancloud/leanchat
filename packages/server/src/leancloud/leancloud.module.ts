import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import AV from 'leancloud-storage';

@Module({})
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
