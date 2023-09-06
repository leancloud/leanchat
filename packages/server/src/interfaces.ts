export interface IMessage {
  id: string;
  type: string;
  from: {
    type: string;
    id?: string;
  };
  data: any;
}
