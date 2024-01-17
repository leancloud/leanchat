import { Index, ModelOptions, Prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

import { ChatbotQuestionMatcher } from '../constants';
import { ChatbotMessage } from './chatbot-message.model';

@Index({ questionBaseId: 1 })
@ModelOptions({
  schemaOptions: {
    collection: 'chatbot_question',
    timestamps: true,
  },
})
export class ChatbotQuestion {
  _id: Types.ObjectId;

  id: string;

  @Prop()
  questionBaseId: Types.ObjectId;

  @Prop({ enum: ChatbotQuestionMatcher })
  matcher: ChatbotQuestionMatcher;

  @Prop()
  question: string;

  @Prop({ type: String })
  similarQuestions?: string[];

  @Prop({ _id: false })
  answer: ChatbotMessage;

  @Prop()
  nextQuestionBaseId?: Types.ObjectId;

  @Prop()
  assignOperator?: boolean;

  createdAt: Date;

  updatedAt: Date;

  match(input: string) {
    const tests = [this.question, ...(this.similarQuestions || [])];
    switch (this.matcher) {
      case ChatbotQuestionMatcher.Equal:
        return tests.some((test) => test === input);
      case ChatbotQuestionMatcher.Substring:
        return tests.some((test) => input.includes(test));
      default:
        return false;
    }
  }
}
