import { DocumentType, ModelOptions, Prop } from '@typegoose/typegoose';
import { SchemaTypes, Types } from 'mongoose';

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
  visitorId: Types.ObjectId;

  @Prop()
  operatorId?: Types.ObjectId;

  @Prop({ type: SchemaTypes.Mixed })
  lastMessage?: any;

  @Prop()
  status: string;

  @Prop()
  queuedAt?: Date;

  @Prop()
  visitorLastActivityAt?: Date;

  @Prop({ type: SchemaTypes.Mixed })
  evaluation?: {
    star: number;
    feedback: string;
  };

  @Prop()
  categoryId?: Types.ObjectId;

  createdAt: Date;

  updatedAt: Date;
}

export type ConversationDocument = DocumentType<Conversation>;
