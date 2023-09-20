import { ConversationDto } from './dtos/conversation.dto';
import { MessageDto } from './dtos/message.dto';

export interface WidgetInitialized {
  conversation?: ConversationDto;
  messages?: MessageDto[];
}
