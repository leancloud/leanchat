import { DocumentType, ModelOptions, Prop } from '@typegoose/typegoose';
import { SchemaTypes, Types } from 'mongoose';

class Timestamps {
  @Prop()
  queuedAt?: Date;

  @Prop()
  operatorJoinedAt?: Date;

  @Prop()
  operatorFirstMessageAt?: Date;

  @Prop()
  operatorLastMessageAt?: Date;

  @Prop()
  visitorLastMessageAt?: Date;

  @Prop()
  closedAt?: Date;
}

class Stats {
  @Prop()
  visitorMessageCount?: number;

  @Prop()
  operatorMessageCount?: number;

  @Prop()
  firstResponseTime?: number;

  @Prop()
  totalResponseTime?: number;

  @Prop()
  totalResponseCount?: number;

  @Prop()
  receptionTime?: number;
}

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

  @Prop({ type: SchemaTypes.ObjectId, default: [] })
  operatorIds: Types.Array<Types.ObjectId>;

  @Prop({ type: SchemaTypes.Mixed })
  lastMessage?: any;

  @Prop()
  status: string;

  @Prop()
  queuedAt?: Date;

  @Prop({ type: SchemaTypes.Mixed })
  evaluation?: {
    star: number;
    feedback: string;
  };

  @Prop()
  categoryId?: Types.ObjectId;

  @Prop({ _id: false, default: {} })
  timestamps: Timestamps;

  @Prop({ _id: false, default: {} })
  stats: Stats;

  createdAt: Date;

  updatedAt: Date;
}

export type ConversationDocument = DocumentType<Conversation>;
