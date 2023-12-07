import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';

import { CategoryService } from 'src/category';
import { AuthGuard } from '../guards/auth.guard';
import {
  CategoryDto,
  CreateCategoriesDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../dtos/category';

@Controller('categories')
@UseGuards(AuthGuard)
@UsePipes(ZodValidationPipe)
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get()
  async getCategories() {
    const categories = await this.categoryService.getCategories();
    return categories.map(CategoryDto.fromDocument);
  }

  @Post()
  async createCategory(@Body() data: CreateCategoryDto) {
    const category = await this.categoryService.createCategory(data);
    return CategoryDto.fromDocument(category);
  }

  @Post('batch')
  async createSome(@Body() data: CreateCategoriesDto) {
    const categories = await this.categoryService.createCategories(data.data);
    return categories.map(CategoryDto.fromDocument);
  }

  @Patch(':id')
  async updateCategory(
    @Param('id') id: string,
    @Body() data: UpdateCategoryDto,
  ) {
    const category = await this.categoryService.getCategory(id);
    if (!category) {
      throw new NotFoundException('分类不存在');
    }
    await this.categoryService.updateCategory(category, data);
    return CategoryDto.fromDocument(category);
  }
}
