import { ConversationDto } from './dtos/conversation.dto';
import { MessageDto } from './dtos/message.dto';

export interface WidgetInitialized {
  greeting?: {
    text: string;
  };
  conversation?: ConversationDto;
  messages?: MessageDto[];
}
