export class IMessage {
  conversation: string;

  from: {
    type: string;
    id: string;
  };

  type: string;

  data: Record<string, any>;
}
