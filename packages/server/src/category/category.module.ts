import { Module } from '@nestjs/common';
import { TypegooseModule } from '@m8a/nestjs-typegoose';

import { CategoryService } from './category.service';
import { Category } from './category.model';

@Module({
  imports: [TypegooseModule.forFeature([Category])],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
