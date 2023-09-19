import {
  DocumentType,
  Index,
  ModelOptions,
  Prop,
  Severity,
} from '@typegoose/typegoose';
import { Types } from 'mongoose';

@Index({ visitorId: 1 })
@Index({ conversationId: 1 })
@Index({ createdAt: 1 })
@ModelOptions({
  schemaOptions: {
    collection: 'message',
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class Message {
  _id: Types.ObjectId;

  id: string;

  @Prop()
  visitorId: Types.ObjectId;

  @Prop()
  conversationId: Types.ObjectId;

  @Prop()
  type: string;

  @Prop()
  from: any;

  @Prop()
  data: any;

  createdAt: Date;

  updatedAt: Date;
}

export type MessageDocument = DocumentType<Message>;
