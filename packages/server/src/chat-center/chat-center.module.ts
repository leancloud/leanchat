import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypegooseModule } from '@m8a/nestjs-typegoose';

import { ChatModule } from 'src/chat';
import { CategoryModule } from 'src/category';
import { QuickReplyModule } from 'src/quick-reply';
import { OperatorOnlineRecord } from './models/operator-online-record.model';
import { OperatorWorkingTime } from './models/operator-working-time.model';
import { ChatGateway } from './chat.gateway';
import {
  AutoCloseConversationService,
  ConversationTransformService,
  OperatorOnlineService,
  OperatorWorkingTimeService,
  SessionService,
} from './services';
import {
  APIController,
  CategoryController,
  ConfigController,
  ConversationController,
  OperatorController,
  QuickReplyController,
  SessionController,
  StatisticsController,
  VisitorController,
} from './controllers';
import { MessageDto } from './dtos/message';

@Module({
  imports: [
    TypegooseModule.forFeature([OperatorOnlineRecord, OperatorWorkingTime]),
    ChatModule,
    CategoryModule,
    QuickReplyModule,
  ],
  providers: [
    ChatGateway,
    AutoCloseConversationService,
    OperatorOnlineService,
    OperatorWorkingTimeService,
    ConversationTransformService,
    SessionService,
  ],
  controllers: [
    APIController,
    OperatorController,
    SessionController,
    ConversationController,
    VisitorController,
    CategoryController,
    QuickReplyController,
    ConfigController,
    StatisticsController,
  ],
})
export class ChatCenterModule implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    MessageDto.fileDomain = this.configService.getOrThrow(
      'LEANCHAT_FILE_DOMAIN',
    );
  }
}
