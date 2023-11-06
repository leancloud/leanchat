import { ConversationDto } from './dtos/conversation.dto';
import { MessageDto } from './dtos/message.dto';

export interface WidgetInitialized {
  status: 'inService' | 'busy';
  conversation?: ConversationDto;
  messages: MessageDto[];
}
