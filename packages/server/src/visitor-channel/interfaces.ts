import { ConversationDto } from './dtos/conversation.dto';
import { MessageDto } from './dtos/message.dto';

export interface WidgetInitialized {
  status: 'online' | 'busy' | 'offline';
  conversation?: ConversationDto;
  messages: MessageDto[];
}
