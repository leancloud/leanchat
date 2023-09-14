import { DocumentType, Index, ModelOptions, Prop } from '@typegoose/typegoose';
import { SchemaTypes, Types } from 'mongoose';

@Index({ memberIds: 1 })
@Index({ createdAt: 1 })
@ModelOptions({
  schemaOptions: {
    collection: 'skill_group',
    timestamps: true,
  },
})
export class SkillGroup {
  _id: Types.ObjectId;

  id: string;

  @Prop()
  name: string;

  @Prop({ type: SchemaTypes.ObjectId, default: [] })
  memberIds: Types.ObjectId[];

  createdAt: Date;

  updatedAt: Date;
}

export type SkillGroupDocument = DocumentType<SkillGroup>;
