import { DocumentType, ModelOptions, Prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

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

  @Prop()
  tags?: string[];

  createdAt: Date;

  updatedAt: Date;
}

export type QuickReplyDocument = DocumentType<QuickReply>;
