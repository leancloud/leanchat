import { encodeRFC3986URIComponent } from 'src/common/helpers/uri';
import { Message } from 'src/chat';

export class MessageDto {
  id: string;

  visitorId: string;

  conversationId: string;

  type: number;

  from: any;

  data: any;

  createdAt: string;

  updatedAt: string;

  static fileDomain = '';

  static getFileURL(key: string) {
    return `${MessageDto.fileDomain}/${encodeRFC3986URIComponent(key)}`;
  }

  static fromDocument(message: Message) {
    const dto = new MessageDto();
    dto.id = message.id ?? message._id.toHexString();
    dto.visitorId = message.visitorId.toString();
    dto.conversationId = message.conversationId.toString();
    dto.type = message.type;
    dto.from = message.from;
    dto.data = message.data;
    if (dto.data?.file) {
      dto.data.file.url = MessageDto.getFileURL(dto.data.file.key);
    }
    dto.createdAt = message.createdAt.toISOString();
    dto.updatedAt = message.updatedAt.toISOString();
    return dto;
  }
}
