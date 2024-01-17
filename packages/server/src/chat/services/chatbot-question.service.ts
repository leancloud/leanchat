import { InjectModel } from '@m8a/nestjs-typegoose';
import { Injectable } from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';
import { AnyKeys, FilterQuery } from 'mongoose';

import { objectId } from 'src/helpers';
import { ChatbotQuestion, ChatbotQuestionBase } from '../models';
import {
  CreateChatbotQuestionBaseData,
  CreateChatbotQuestionData,
  UpdateChatbotQuestionBaseData,
  UpdateChatbotQuestionData,
} from '../interfaces';

@Injectable()
export class ChatbotQuestionService {
  @InjectModel(ChatbotQuestion)
  private Question: ReturnModelType<typeof ChatbotQuestion>;

  @InjectModel(ChatbotQuestionBase)
  private QuestionBase: ReturnModelType<typeof ChatbotQuestionBase>;

  createQuestionBase(data: CreateChatbotQuestionBaseData) {
    const base = new this.QuestionBase();
    base.name = data.name;
    return base.save();
  }

  updateQuestionBase(id: string, data: UpdateChatbotQuestionBaseData) {
    const $set: AnyKeys<ChatbotQuestionBase> = {
      name: data.name,
    };
    return this.QuestionBase.findByIdAndUpdate(
      id,
      { $set },
      { new: true },
    ).exec();
  }

  getQuestionBases() {
    return this.QuestionBase.find().exec();
  }

  getQuestionBase(id: string) {
    return this.QuestionBase.findById(id).exec();
  }

  createQuestion(data: CreateChatbotQuestionData) {
    const question = new this.Question();
    question.questionBaseId = objectId(data.questionBaseId);
    question.matcher = data.matcher;
    question.question = data.question;
    question.similarQuestions = data.similarQuestions;
    question.answer = data.answer;
    if (data.nextQuestionBaseId) {
      question.nextQuestionBaseId = objectId(data.nextQuestionBaseId);
    }
    question.assignOperator = data.assignOperator;
    return question.save();
  }

  updateQuestion(
    filter: FilterQuery<ChatbotQuestion>,
    data: UpdateChatbotQuestionData,
  ) {
    const $set: AnyKeys<ChatbotQuestion> = {
      matcher: data.matcher,
      question: data.question,
      similarQuestions: data.similarQuestions,
      answer: data.answer,
      assignOperator: data.assignOperator,
    };
    const $unset: AnyKeys<ChatbotQuestion> = {};

    if (data.nextQuestionBaseId) {
      $set.nextQuestionBaseId = objectId(data.nextQuestionBaseId);
    } else if (data.nextQuestionBaseId === null) {
      $unset.nextQuestionBaseId = '';
    }

    return this.Question.findOneAndUpdate(
      filter,
      { $set, $unset },
      { new: true },
    ).exec();
  }

  getQuestions(filter: FilterQuery<ChatbotQuestion>) {
    return this.Question.find(filter).exec();
  }

  deleteQuestion(filter: FilterQuery<ChatbotQuestion>) {
    return this.Question.findOneAndDelete(filter).exec();
  }
}
