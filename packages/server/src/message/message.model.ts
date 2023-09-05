import { DocumentType, Ref, modelOptions, prop } from '@typegoose/typegoose';
import { SchemaTypes, Types } from 'mongoose';
import { Conversation } from 'src/conversation/conversation.model';

@modelOptions({
  schemaOptions: {
    collection: 'message',
    timestamps: true,
  },
})
export class Message {
  @prop()
  visitor: Types.ObjectId;

  @prop({ ref: () => Conversation })
  conversation: Ref<Conversation>;

  @prop()
  type: string;

  @prop({ type: SchemaTypes.Mixed })
  from: {
    type: string;
    id: string;
  };

  @prop()
  data: any;

  createdAt: Date;

  updatedAt: Date;
}

export type MessageDocument = DocumentType<Message>;
