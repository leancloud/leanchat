import { DocumentType, Ref, modelOptions, prop } from '@typegoose/typegoose';

@modelOptions({
  schemaOptions: {
    collection: 'category',
    timestamps: true,
  },
})
export class Category {
  @prop()
  name: string;

  @prop({ ref: () => Category })
  parent?: Ref<Category>;

  createdAt: Date;

  updatedAt: Date;
}

export type CategoryDocument = DocumentType<Category>;
