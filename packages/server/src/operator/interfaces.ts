export interface ICreateOperator {
  /**
   * @minLength 6
   * @maxLength 24
   */
  username: string;

  /**
   * @minLength 6
   * @maxLength 64
   */
  password: string;

  /**
   * @maxLength 16
   */
  externalName: string;

  /**
   * @maxLength 16
   */
  internalName: string;

  /**
   * @type uint
   */
  maxCustomerCount: number;
}
