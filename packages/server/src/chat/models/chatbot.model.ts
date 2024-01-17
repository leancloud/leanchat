import { ModelOptions, Prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

import { ChatbotMessage } from './chatbot-message.model';
import { ChatbotAcceptRule } from '../constants';

@ModelOptions({
  schemaOptions: {
    collection: 'chatbot',
    timestamps: true,
  },
})
export class Chatbot {
  _id: Types.ObjectId;

  id: string;

  @Prop()
  name: string;

  @Prop({ enum: ChatbotAcceptRule })
  acceptRule: ChatbotAcceptRule;

  @Prop({ type: Types.ObjectId })
  globalQuestionBaseIds: Types.ObjectId[];

  @Prop({ type: Types.ObjectId })
  initialQuestionBaseIds: Types.ObjectId[];

  @Prop({ _id: false })
  greetingMessage: ChatbotMessage;

  @Prop({ _id: false })
  noMatchMessage: ChatbotMessage;

  createdAt: Date;

  updatedAt: Date;
}
