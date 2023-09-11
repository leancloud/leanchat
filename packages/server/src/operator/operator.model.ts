import { DocumentType, Index, ModelOptions, Prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

@Index({ username: 1 }, { unique: true })
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
  password?: string;

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
