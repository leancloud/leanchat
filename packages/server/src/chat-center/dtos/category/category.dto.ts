import { Exclude, Expose } from 'class-transformer';

import { CategoryDocument } from 'src/category';

@Exclude()
export class CategoryDto {
  constructor(private category: CategoryDocument) {}

  @Expose()
  get id() {
    return this.category.id;
  }

  @Expose()
  get name() {
    return this.category.name;
  }

  @Expose()
  get parentId() {
    return this.category.parent?._id.toString();
  }

  @Expose()
  get createdAt() {
    return this.category.createdAt;
  }

  @Expose()
  get updatedAt() {
    return this.category.updatedAt;
  }
}
