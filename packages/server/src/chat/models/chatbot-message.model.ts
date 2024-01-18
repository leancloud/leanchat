import { Prop } from '@typegoose/typegoose';

export class ChatbotMessage {
  @Prop()
  text: string;
}
