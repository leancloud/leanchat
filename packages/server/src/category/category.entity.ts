export class Category {
  id: string;

  name: string;

  parentId: string;

  static fromAVObject(obj: { get(key: string): any }) {
    const category = new Category();
    category.id = obj.get('objectId');
    category.name = obj.get('name');
    category.parentId = obj.get('parentId');
    return category;
  }
}
