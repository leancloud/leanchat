import { Message, MessageType, UserType } from 'src/chat';

export class MessageDto {
  id: string;

  type: number;

  from: any;

  data: any;

  static fileDomain = '';

  static getFileURL(key: string) {
    return `${MessageDto.fileDomain}/${key}`;
  }

  static fromDocument(message: Message) {
    const dto = new MessageDto();
    dto.id = message.id;
    dto.type = message.type;
    dto.from = message.from;
    dto.data = message.data;
    if (dto.data?.file) {
      dto.data.file.url = MessageDto.getFileURL(dto.data.file.key);
    }
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
