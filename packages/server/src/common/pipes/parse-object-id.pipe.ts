import { BadRequestException, PipeTransform } from '@nestjs/common';
import { Types } from 'mongoose';

export class ParseObjectIdPipe implements PipeTransform {
  transform(value: string) {
    try {
      return new Types.ObjectId(value);
    } catch {
      throw new BadRequestException('无效的ID');
    }
  }
}
