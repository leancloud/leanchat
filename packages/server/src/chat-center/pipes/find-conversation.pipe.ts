import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';

import { ConversationService } from 'src/chat';

@Injectable()
export class FindConversationPipe implements PipeTransform<string> {
  constructor(private conversationService: ConversationService) {}

  async transform(value: string) {
    const conversation = await this.conversationService.getConversation(value);
    if (!conversation) {
      throw new NotFoundException(`Conversation does ${value} not exist`);
    }
    return conversation;
  }
}
