import AV from 'leancloud-storage';

export class Visitor {
  id: string;

  anonymousId?: string;

  static fromAVObject(obj: AV.Object) {
    const json = obj.toJSON();
    const visitor = new Visitor();
    visitor.id = json.objectId;
    visitor.anonymousId = json.anonymousId;
    return visitor;
  }
}
