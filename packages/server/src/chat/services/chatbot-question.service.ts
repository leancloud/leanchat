import { InjectModel } from '@m8a/nestjs-typegoose';
import { Injectable } from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';
import { AnyKeys, FilterQuery, Types } from 'mongoose';
import _ from 'lodash';

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
    question.code = data.code;
    question.position = Date.now();
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

    if (data.code) {
      $set.code = data.code;
    } else if (data.code === null) {
      $unset.code = '';
    }

    return this.Question.findOneAndUpdate(
      filter,
      { $set, $unset },
      { new: true },
    ).exec();
  }

  getQuestions(questionBaseId: string | Types.ObjectId) {
    return this.Question.find({ questionBaseId }).sort({ position: 1 }).exec();
  }

  deleteQuestion(filter: FilterQuery<ChatbotQuestion>) {
    return this.Question.findOneAndDelete(filter).exec();
  }

  async reorderQuestions(ids: string[]) {
    if (ids.length === 0) {
      return;
    }
    const indexById = ids.reduce<Record<string, number>>((map, id, index) => {
      map[id] = index;
      return map;
    }, {});
    const questions = await this.Question.find({
      _id: {
        $in: objectId(ids),
      },
    });
    const groups = _.groupBy(questions, (q) => q.questionBaseId.toHexString());
    for (const questions of Object.values(groups)) {
      questions.forEach((q) => {
        q.position = indexById[q.id];
      });
      await this.Question.bulkSave(questions);
    }
  }

  async matchQuestion(
    questionBaseIds: string[] | Types.ObjectId[],
    input: string,
  ) {
    for (const questionBaseId of questionBaseIds) {
      const questions = await this.getQuestions(questionBaseId);
      for (const question of questions) {
        if (question.match(input)) {
          return question;
        }
      }
    }
  }
}
