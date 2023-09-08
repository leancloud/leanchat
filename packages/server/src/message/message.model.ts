import { DocumentType, ModelOptions, Prop } from '@typegoose/typegoose';
import { SchemaTypes, Types } from 'mongoose';

@ModelOptions({
  schemaOptions: {
    collection: 'message',
    timestamps: true,
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

  @Prop({ type: SchemaTypes.Mixed })
  from: {
    type: string;
    id: string;
  };

  @Prop()
  data: any;

  createdAt: Date;

  updatedAt: Date;
}

export type MessageDocument = DocumentType<Message>;
