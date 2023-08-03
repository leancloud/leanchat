import { Injectable } from '@nestjs/common';
import AV from 'leancloud-storage';
import { Visitor } from './visitor.entity';

@Injectable()
export class VisitorService {
  async registerVisitorByAnonymousId(anonymousId: string) {
    const query = new AV.Query('ChatVisitor');
    query.equalTo('anonymousId', anonymousId);
    const existObj = await query.first({ useMasterKey: true });
    if (existObj) {
      return Visitor.fromAVObject(existObj as AV.Object);
    }

    const obj = new AV.Object('ChatVisitor', {
      anonymousId,
    });
    await obj.save(null, { useMasterKey: true });
    return Visitor.fromAVObject(obj);
  }
}
