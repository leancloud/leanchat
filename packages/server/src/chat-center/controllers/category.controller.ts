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
import { CreateCategoryDto, UpdateCategoryDto } from '../dtos/category';

@Controller('categories')
@UseGuards(AuthGuard)
@UsePipes(ZodValidationPipe)
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get()
  getCategories() {
    return this.categoryService.getCategories();
  }

  @Post()
  createCategory(@Body() data: CreateCategoryDto) {
    return this.categoryService.createCategory(data);
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
  }
}
