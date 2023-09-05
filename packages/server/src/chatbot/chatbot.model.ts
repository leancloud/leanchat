import { DocumentType, modelOptions, prop } from '@typegoose/typegoose';

import { ChatbotEdge, ChatbotNode } from './interfaces';

@modelOptions({
  schemaOptions: {
    collection: 'chatbot',
    timestamps: true,
  },
})
export class Chatbot {
  @prop()
  name: string;

  @prop()
  nodes: ChatbotNode[];

  @prop()
  edges: ChatbotEdge[];

  createdAt: Date;

  updatedAt: Date;
}

export type ChatbotDocument = DocumentType<Chatbot>;
