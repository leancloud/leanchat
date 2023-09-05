import { DocumentType, Ref, modelOptions, prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

@modelOptions({
  schemaOptions: {
    collection: 'category',
    timestamps: true,
  },
})
export class Category {
  _id: Types.ObjectId;

  id: string;

  @prop()
  name: string;

  @prop({ ref: () => Category })
  parent?: Ref<Category>;

  createdAt: Date;

  updatedAt: Date;
}

export type CategoryDocument = DocumentType<Category>;
