import { ModelOptions, Prop, Severity } from '@typegoose/typegoose';
import { Types } from 'mongoose';

@ModelOptions({
  schemaOptions: {
    collection: 'config',
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class Config {
  _id: Types.ObjectId;

  id: string;

  @Prop({ index: true, unique: true })
  key: string;

  @Prop()
  value: any;

  createdAt: Date;

  updatedAt: Date;
}
