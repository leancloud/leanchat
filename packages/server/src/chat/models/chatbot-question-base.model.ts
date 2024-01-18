import { ModelOptions, Prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

@ModelOptions({
  schemaOptions: {
    collection: 'chatbot_question_base',
    timestamps: true,
  },
})
export class ChatbotQuestionBase {
  _id: Types.ObjectId;

  id: string;

  @Prop()
  name: string;

  createdAt: Date;

  updatedAt: Date;
}
