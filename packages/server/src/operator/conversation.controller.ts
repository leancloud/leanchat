import { TypedQuery } from '@nestia/core';
import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import AV from 'leancloud-storage';

import { IGetConversationsDto } from './interfaces';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentOperator } from './decorators';
import { Operator } from './operator.entity';

@Controller('conversations')
@UseGuards(AuthGuard)
export class ConversationController {
  @Get()
  async getConversations(
    @TypedQuery() { status, operatorId }: IGetConversationsDto,
  ) {
    const query = new AV.Query('ChatVisitor');
    if (status) {
      query.equalTo('status', status);
    }
    if (operatorId) {
      query.equalTo('operatorId', operatorId);
    }
    if (operatorId === null) {
      query.doesNotExist('operatorId');
    }
    query.addDescending('createdAt');
    const objs = await query.find({ useMasterKey: true });
    return objs.map((obj) => {
      return {
        id: obj.id,
        channel: obj.get('channel'),
        recentMessage: obj.get('recentMessage'),
        status: obj.get('status'),
      };
    });
  }

  @Get(':id/messages')
  async getMessages(@Param('id') id: string) {
    const query = new AV.Query('ChatMessage');
    query.equalTo('visitorId', id);
    const objs = await query.find({ useMasterKey: true });
    return objs.map((obj) => {
      return {
        id: obj.id,
        type: obj.get('type'),
        from: obj.get('from'),
        data: obj.get('data'),
        createdAt: obj.createdAt,
      };
    });
  }

  @Post(':id/join')
  async updateConversation(
    @Param('id') id: string,
    @CurrentOperator() operator: Operator,
  ) {
    const query = new AV.Query('ChatVisitor');
    query.equalTo('objectId', id);
    const obj = (await query.first({ useMasterKey: true })) as
      | AV.Object
      | undefined;
    if (!obj) {
      throw new NotFoundException(`会话 ${id} 不存在`);
    }
    if (obj.has('operatorId')) {
      throw new ForbiddenException(`会话 ${id} 已被分配`);
    }
    obj.set('operatorId', operator.id);
    obj.set('status', 'inProgress');
    await obj.save(null, { useMasterKey: true });
  }
}
