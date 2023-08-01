export interface IPagination {
  /**
   * @type uint
   * @minimum 1
   */
  page?: number;

  /**
   * @type uint
   * @minimum 1
   * @maximnm 100
   */
  pageSize?: number;
}
