import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { Types } from 'mongoose';

import { ParseObjectIdPipe } from 'src/common/pipes';
import { OperatorRole } from 'src/chat/constants';
import { ChatbotQuestionService } from 'src/chat/services';
import { AuthGuard } from '../guards';
import { Roles } from '../decorators';
import {
  ChatbotQuestionBaseDto,
  ChatbotQuestionDto,
  CreateChatbotQuestionBaseDto,
  CreateChatbotQuestionDto,
  ReorderChatbotQuestionsDto,
  UpdateChatbotQuestionBaseDto,
} from '../dtos/chatbot';
import { UpdateChatbotQuestionDto } from '../dtos/chatbot/update-chatbot-question.dto';

@Controller('chatbot-question-bases')
@UseGuards(AuthGuard)
@Roles(OperatorRole.Admin)
@UsePipes(ZodValidationPipe)
export class ChatbotQuestionBaseController {
  constructor(private chatbotQuestionService: ChatbotQuestionService) {}

  @Post()
  async createBase(@Body() data: CreateChatbotQuestionBaseDto) {
    const question = await this.chatbotQuestionService.createQuestionBase({
      name: data.name,
    });
    return ChatbotQuestionBaseDto.fromDocument(question);
  }

  @Patch(':id')
  async updateBase(
    @Param('id') id: string,
    @Body() data: UpdateChatbotQuestionBaseDto,
  ) {
    const base = await this.chatbotQuestionService.updateQuestionBase(id, data);
    if (!base) {
      throw new NotFoundException('问题库不存在');
    }
    return ChatbotQuestionBaseDto.fromDocument(base);
  }

  @Get()
  async getBases() {
    const bases = await this.chatbotQuestionService.getQuestionBases();
    return bases.map(ChatbotQuestionBaseDto.fromDocument);
  }

  @Get(':id')
  async getBase(@Param('id') id: string) {
    const base = await this.chatbotQuestionService.getQuestionBase(id);
    if (!base) {
      throw new NotFoundException('问题库不存在');
    }
    return ChatbotQuestionBaseDto.fromDocument(base);
  }

  @Post(':id/questions')
  async createQuestion(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() data: CreateChatbotQuestionDto,
  ) {
    const question = await this.chatbotQuestionService.createQuestion({
      ...data,
      questionBaseId: id,
    });
    return ChatbotQuestionDto.fromDocument(question);
  }

  @Patch(':id/questions/:qid')
  async updateQuestion(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Param('qid', ParseObjectIdPipe) qid: Types.ObjectId,
    @Body() data: UpdateChatbotQuestionDto,
  ) {
    const question = await this.chatbotQuestionService.updateQuestion(
      { _id: qid, questionBaseId: id },
      data,
    );
    if (!question) {
      throw new NotFoundException('问题不存在');
    }
    return ChatbotQuestionDto.fromDocument(question);
  }

  @Get(':id/questions')
  async getQuestions(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    const questions = await this.chatbotQuestionService.getQuestions(id);
    return questions.map(ChatbotQuestionDto.fromDocument);
  }

  @Delete(':bid/questions/:qid')
  async deleteQuestion(
    @Param('bid', ParseObjectIdPipe) bid: Types.ObjectId,
    @Param('qid', ParseObjectIdPipe) qid: Types.ObjectId,
  ) {
    await this.chatbotQuestionService.deleteQuestion({
      _id: qid,
      questionBaseId: bid,
    });
  }

  @Post('reorder-questions')
  async reorderQuestions(@Body() data: ReorderChatbotQuestionsDto) {
    await this.chatbotQuestionService.reorderQuestions(data.ids);
  }
}
