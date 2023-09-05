import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { Category, CategoryDocument } from './category.model';
import { CreateCategoryData, UpdateCategoryData } from './interfaces';

@Injectable()
export class CategoryService {
  @InjectModel(Category)
  private categoryModel: ReturnModelType<typeof Category>;

  getCategories() {
    return this.categoryModel.find().exec();
  }

  getCategory(id: string) {
    return this.categoryModel.findById(id).exec();
  }

  async createCategory(data: CreateCategoryData) {
    const category = new this.categoryModel({
      name: data.name,
    });
    if (data.parentId) {
      const parent = await this.getCategory(data.parentId);
      if (!parent) {
        throw new BadRequestException('父分类不存在');
      }
      category.parent = parent.id;
    }
    return category.save();
  }

  async updateCategory(category: CategoryDocument, data: UpdateCategoryData) {
    if (data.name) {
      category.set('name', data.name);
    }
    return category.save();
  }
}
