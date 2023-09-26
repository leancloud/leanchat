import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';

import { VisitorService } from 'src/chat';

@Injectable()
export class FindVisitorPipe implements PipeTransform<string> {
  constructor(private visitorService: VisitorService) {}

  async transform(value: string) {
    const visitor = await this.visitorService.getVisitor(value);
    if (!visitor) {
      throw new NotFoundException(`Visitor does ${value} not exist`);
    }
    return visitor;
  }
}
