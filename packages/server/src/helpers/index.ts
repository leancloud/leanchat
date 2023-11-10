import { Types } from 'mongoose';

export function objectId(value: string | Types.ObjectId): Types.ObjectId;
export function objectId(value: string[] | Types.ObjectId[]): Types.ObjectId[];
export function objectId(
  value: string | Types.ObjectId | string[] | Types.ObjectId[],
) {
  if (Array.isArray(value)) {
    if (!value.length) {
      return value;
    }
    if (typeof value[0] === 'string') {
      return value.map((id) => new Types.ObjectId(id));
    }
    return value;
  }
  if (typeof value === 'string') {
    return new Types.ObjectId(value);
  }
  return value;
}
