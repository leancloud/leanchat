export class Visitor {
  id: string;

  channel: string;

  chatId?: string;

  currentConversationId?: string;

  static fromAVObject(obj: { get: (key: string) => any }) {
    const visitor = new Visitor();
    visitor.id = obj.get('objectId');
    visitor.channel = obj.get('channel');
    visitor.chatId = obj.get('chatId');
    visitor.currentConversationId = obj.get('currentConversationId');
    return visitor;
  }

  clone() {
    const visitor = new Visitor();
    visitor.id = this.id;
    visitor.channel = this.channel;
    visitor.chatId = this.chatId;
    visitor.currentConversationId = this.currentConversationId;
    return visitor;
  }
}
