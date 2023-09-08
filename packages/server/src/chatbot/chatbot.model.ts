import { DocumentType, ModelOptions, Prop } from '@typegoose/typegoose';

import { ChatbotEdge, ChatbotNode } from './interfaces';

@ModelOptions({
  schemaOptions: {
    collection: 'chatbot',
    timestamps: true,
  },
})
export class Chatbot {
  @Prop()
  name: string;

  @Prop()
  nodes: ChatbotNode[];

  @Prop()
  edges: ChatbotEdge[];

  createdAt: Date;

  updatedAt: Date;
}

export type ChatbotDocument = DocumentType<Chatbot>;
