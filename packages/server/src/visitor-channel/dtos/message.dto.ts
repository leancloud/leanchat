import { Message, MessageType, UserType } from 'src/chat';

export class MessageDto {
  id: string;

  type: number;

  from: any;

  data: any;

  static fromDocument(message: Message) {
    const dto = new MessageDto();
    dto.id = message.id;
    dto.type = message.type;
    dto.from = message.from;
    dto.data = message.data;
    return dto;
  }

  static fromText(id: string, text: string) {
    const dto = new MessageDto();
    dto.id = id;
    dto.type = MessageType.Message;
    dto.from = {
      type: UserType.System,
    };
    dto.data = {
      text,
    };
    return dto;
  }
}
