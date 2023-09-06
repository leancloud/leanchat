import { DocumentType, ModelOptions, Prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

@ModelOptions({
  schemaOptions: {
    collection: 'operator',
    timestamps: true,
  },
})
export class Operator {
  _id: Types.ObjectId;

  id: string;

  @Prop()
  username: string;

  @Prop({ select: false })
  password: string;

  @Prop()
  externalName: string;

  @Prop()
  internalName: string;

  @Prop()
  concurrency: number;

  createdAt: Date;

  updatedAt: Date;
}

export type OperatorDocument = DocumentType<Operator>;
