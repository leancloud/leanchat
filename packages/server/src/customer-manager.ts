import AV from 'leancloud-storage';
import { nanoid } from 'nanoid';

export interface Customer {
  id: string;
  customerId: string;
}

export class CustomerManager {
  encodeCustomerObject(obj: AV.Object): Customer {
    return {
      id: obj.id!,
      customerId: obj.get('customerId'),
    };
  }

  createCustomerObject() {
    return new AV.Object('ChatCustomer');
  }

  createCustomerQuery() {
    return new AV.Query('ChatCustomer');
  }

  createCustomerId() {
    return `customer_${nanoid()}`;
  }

  async createCustomer() {
    const obj = this.createCustomerObject();
    const customerId = this.createCustomerId();
    obj.set('customerId', customerId);
    await obj.save(null, { useMasterKey: true });
    return this.encodeCustomerObject(obj);
  }

  async getCustomer(customerId: string) {
    const query = this.createCustomerQuery();
    query.equalTo('customerId', customerId);
    const obj = await query.first({ useMasterKey: true });
    if (obj) {
      return this.encodeCustomerObject(obj as AV.Object);
    }
  }
}
