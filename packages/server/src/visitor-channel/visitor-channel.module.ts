import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ChatModule } from 'src/chat';
import { VisitorGateway } from './visitor.gateway';
import { VisitorChannelService } from './visitor-channel.service';
import { MessageDto } from './dtos/message.dto';

@Module({
  imports: [ChatModule],
  providers: [VisitorGateway, VisitorChannelService],
})
export class VisitorChannelModule implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    MessageDto.fileDomain = this.configService.getOrThrow(
      'LEANCHAT_FILE_DOMAIN',
    );
  }
}
