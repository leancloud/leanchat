import { DocumentType, Index, ModelOptions, Prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

@Index({ chatId: 1 }, { unique: true })
@ModelOptions({
  schemaOptions: {
    collection: 'visitor',
    timestamps: true,
  },
})
export class Visitor {
  _id: Types.ObjectId;

  id: string;

  @Prop()
  channel: string;

  @Prop()
  chatId?: string;

  @Prop()
  currentConversationId?: Types.ObjectId;

  createdAt: Date;

  updatedAt: Date;
}

export type VisitorDocument = DocumentType<Visitor>;
