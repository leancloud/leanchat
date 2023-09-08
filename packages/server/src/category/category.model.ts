import { DocumentType, ModelOptions, Prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

@ModelOptions({
  schemaOptions: {
    collection: 'category',
    timestamps: true,
  },
})
export class Category {
  _id: Types.ObjectId;

  id: string;

  @Prop()
  name: string;

  @Prop()
  parentId?: Types.ObjectId;

  createdAt: Date;

  updatedAt: Date;
}

export type CategoryDocument = DocumentType<Category>;
