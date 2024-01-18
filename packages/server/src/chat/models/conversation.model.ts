import { Index, ModelOptions, Prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

import { UserInfo } from './user-info.model';
import { Channel, ConsultationResult, ConversationStatus } from '../constants';

@ModelOptions({
  schemaOptions: {
    _id: false,
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  },
})
class Evaluation {
  @Prop()
  star: number;

  @Prop()
  feedback?: string;

  @Prop({ type: String })
  tags?: string[];

  createdAt: Date;
}

class Stats {
  @Prop()
  visitorMessageCount?: number;

  @Prop()
  operatorMessageCount?: number;

  @Prop()
  firstResponseTime?: number;

  @Prop()
  maxResponseTime?: number;

  @Prop()
  responseTime?: number;

  @Prop()
  responseCount?: number;

  @Prop()
  averageResponseTime?: number;

  @Prop()
  receptionTime?: number;

  @Prop()
  firstOperatorJoinedAt?: Date;

  @Prop()
  reassigned?: boolean;

  @Prop()
  operatorFirstMessageCreatedAt?: Date;

  @Prop()
  operatorLastMessageCreatedAt?: Date;

  @Prop()
  visitorFirstMessageCreatedAt?: Date;

  @Prop()
  visitorLastMessageCreatedAt?: Date;

  @Prop()
  queueConnectionTime?: number;

  @Prop()
  queueTimeToLeave?: number;

  @Prop()
  consultationResult?: ConsultationResult;

  @Prop()
  duration?: number;

  /**
   * 会话回合数
   * 用户发言到下一次客服发言计 1 回合
   */
  @Prop()
  round?: number;
}

@ModelOptions({
  schemaOptions: {
    _id: false,
    timestamps: false,
  },
})
class Source {
  @Prop()
  url?: string;
}

@Index({ visitorId: 1 })
@Index({ operatorId: 1 })
@Index({ closedAt: 1 })
@Index({ createdAt: 1 })
@ModelOptions({
  schemaOptions: {
    collection: 'conversation',
    timestamps: true,
  },
})
export class Conversation {
  _id: Types.ObjectId;

  id: string;

  @Prop({ enum: Channel })
  channel: Channel;

  @Prop()
  source?: Source;

  @Prop({ enum: ConversationStatus })
  status: ConversationStatus;

  @Prop()
  visitorId: Types.ObjectId;

  @Prop()
  chatbotId?: Types.ObjectId;

  @Prop()
  operatorId?: Types.ObjectId;

  @Prop()
  categoryId?: Types.ObjectId;

  @Prop()
  evaluation?: Evaluation;

  @Prop()
  evaluationInvitedAt?: Date;

  @Prop({ index: true })
  closedAt?: Date;

  @Prop({ _id: false })
  closedBy?: UserInfo;

  @Prop()
  queuedAt?: Date;

  @Prop()
  visitorLastActivityAt?: Date;

  @Prop()
  operatorLastActivityAt?: Date;

  @Prop()
  visitorWaitingSince?: Date;

  @Prop({ _id: false })
  stats?: Stats;

  createdAt: Date;

  updatedAt: Date;
}
