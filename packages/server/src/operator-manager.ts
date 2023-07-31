import AV from 'leancloud-storage';

export interface Operator {
  id: string;
  maxConvCount: number;
}

export class OperatorManager {
  encodeOperator(obj: AV.Object): Operator {
    return {
      id: obj.id!,
      maxConvCount: obj.get('maxConvCount'),
    };
  }

  getOperatorQuery() {
    return new AV.Query('ChatOperator');
  }

  getOperatorObject(id: string) {
    return this.getOperatorQuery().equalTo('objectId', id).first({ useMasterKey: true }) as Promise<
      AV.Object | undefined
    >;
  }

  async getOperator(id: string) {
    const obj = await this.getOperatorObject(id);
    if (obj) {
      return this.encodeOperator(obj);
    }
  }
}
