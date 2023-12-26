import { DocumentType, Index, ModelOptions, Prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

@Index({ operatorId: 1 })
@ModelOptions({
  schemaOptions: {
    collection: 'quick_reply',
    timestamps: true,
  },
})
export class QuickReply {
  _id: Types.ObjectId;

  id: string;

  @Prop()
  content: string;

  @Prop({ type: String })
  tags?: string[];

  @Prop()
  operatorId?: Types.ObjectId;

  createdAt: Date;

  updatedAt: Date;
}

export type QuickReplyDocument = DocumentType<QuickReply>;
