import { DocumentType, Index, ModelOptions, Prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

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

  @Prop({ default: [] })
  memberIds: Types.ObjectId[];

  createdAt: Date;

  updatedAt: Date;
}

export type SkillGroupDocument = DocumentType<SkillGroup>;
