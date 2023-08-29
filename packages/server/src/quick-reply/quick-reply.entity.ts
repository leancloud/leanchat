export class QuickReply {
  id: string;

  content: string;

  tags?: string[];

  static fromAVObject(obj: { get(key: string): any }) {
    const quickReply = new QuickReply();
    quickReply.id = obj.get('objectId');
    quickReply.content = obj.get('content');
    quickReply.tags = obj.get('tags');
    return quickReply;
  }
}
