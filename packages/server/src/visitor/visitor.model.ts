import { DocumentType, ModelOptions, Prop, Ref } from '@typegoose/typegoose';
import { Types } from 'mongoose';

import { Conversation } from 'src/conversation/conversation.model';

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

  @Prop({ ref: () => Conversation })
  currentConversation?: Ref<Conversation>;

  createdAt: Date;

  updatedAt: Date;
}

export type VisitorDocument = DocumentType<Visitor>;
