export interface CreateOperatorGroupData {
  name: string;
  operatorIds?: string[];
}

export interface UpdateOperatorGroupData {
  name?: string;
  operatorIds?: string[];
}
