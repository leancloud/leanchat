import { BadRequestException, Injectable } from '@nestjs/common';
import AV from 'leancloud-storage';

import { Category } from './category.entity';
import { CreateCategoryData, UpdateCategoryData } from './interfaces';

@Injectable()
export class CategoryService {
  async getCategories() {
    const query = new AV.Query('ChatCategory');
    query.limit(1000);
    const objs = await query.find({ useMasterKey: true });
    return objs.map(Category.fromAVObject);
  }

  async getCategory(id: string) {
    const query = new AV.Query('ChatCategory');
    query.equalTo('objectId', id);
    const obj = await query.first({ useMasterKey: true });
    if (obj) {
      return Category.fromAVObject(obj);
    }
  }

  async createCategory(data: CreateCategoryData) {
    if (data.parentId) {
      const parent = await this.getCategory(data.parentId);
      if (!parent) {
        throw new BadRequestException('父分类不存在');
      }
    }
    const obj = new AV.Object('ChatCategory', {
      name: data.name,
      parentId: data.parentId,
    });
    await obj.save(null, { useMasterKey: true });
    return Category.fromAVObject(obj);
  }

  async updateCategory(category: Category, data: UpdateCategoryData) {
    const obj = AV.Object.createWithoutData('ChatCategory', category.id);
    if (data.name) {
      obj.set('name', data.name);
    }
    await obj.save(null, { useMasterKey: true });
  }
}
