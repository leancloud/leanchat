import { DocumentType, modelOptions, prop } from '@typegoose/typegoose';
import { SchemaTypes, Types } from 'mongoose';

import { Message } from 'src/message';

@modelOptions({
  schemaOptions: {
    collection: 'conversation',
    timestamps: true,
  },
})
export class Conversation {
  @prop()
  visitor: Types.ObjectId;

  @prop()
  operator?: Types.ObjectId;

  @prop({ type: () => SchemaTypes.Mixed })
  lastMessage?: Message;

  @prop()
  status: string;

  @prop()
  queuedAt?: Date;

  @prop()
  visitorLastActivityAt?: Date;

  @prop()
  evaluation?: {
    star: number;
    feedback: string;
  };

  @prop()
  category?: Types.ObjectId;

  createdAt: Date;

  updatedAt: Date;
}

export type ConversationDocument = DocumentType<Conversation>;
