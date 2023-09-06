import { DocumentType, ModelOptions, Prop, Ref } from '@typegoose/typegoose';
import { SchemaTypes, Types } from 'mongoose';

import { Category } from 'src/category';

@ModelOptions({
  schemaOptions: {
    collection: 'conversation',
    timestamps: true,
  },
})
export class Conversation {
  _id: Types.ObjectId;

  id: string;

  @Prop()
  channel: string;

  @Prop()
  visitor: Types.ObjectId;

  @Prop()
  operator?: Types.ObjectId;

  @Prop({ type: () => SchemaTypes.Mixed })
  lastMessage?: any;

  @Prop()
  status: string;

  @Prop()
  queuedAt?: Date;

  @Prop()
  visitorLastActivityAt?: Date;

  @Prop()
  evaluation?: {
    star: number;
    feedback: string;
  };

  @Prop({ ref: () => Category })
  category?: Ref<Category>;

  createdAt: Date;

  updatedAt: Date;
}

export type ConversationDocument = DocumentType<Conversation>;
