import { cond, constant, defaultTo, eq, get, has, map, over, stubTrue, sum } from 'lodash/fp';
import dayjs from 'dayjs';

import { flow, formatDate, toSeconds } from '@/Panel/Statistics/helpers';
import { Conversation, ConsultationResult, OperatorStatus } from '../types';

export const id = get('id');

export const createdAt = flow([get('createdAt'), formatDate]);

export const closedAt = flow([get('closedAt'), formatDate]);

export const visitorId = get('visitorId');

export const operatorId = get('operatorId');

export const operatorName = (getOperatorName: (id: string) => string) =>
  flow([operatorId, getOperatorName]);

export const evaluationStar = flow([
  get('evaluation.star'),
  (star: number) => [, '非常不满意', '不满意', '一般', '满意', '非常满意'][star],
]);

export const messageCount = flow([
  over([get('stats.visitorMessageCount'), get('stats.operatorMessageCount')]),
  map(defaultTo(0)),
  sum,
]);

export const consultationResult = flow([
  get('stats.consultationResult'),
  cond([
    [eq(ConsultationResult.Valid), constant('有效咨询')],
    [eq(ConsultationResult.Invalid), constant('无效咨询')],
    [eq(ConsultationResult.OperatorNoResponse), constant('客服无应答')],
  ]),
]);

export const evaluationInvited = cond([
  [has('evaluationInvitedAt'), constant('已邀请')],
  [stubTrue, constant('未邀请')],
]);

export const receptionTime = flow([get('stats.receptionTime'), toSeconds]);

export const firstResponseTime = flow([get('stats.firstResponseTime'), toSeconds]);

export const firstMessageFromType = (data: Conversation) => {
  if (data.stats) {
    const { visitorFirstMessageCreatedAt: v, operatorFirstMessageCreatedAt: o } = data.stats;
    if (v && o) {
      return dayjs(v).isBefore(o) ? '用户' : '客服';
    }
    if (v) {
      return '用户';
    }
    if (o) {
      return '客服';
    }
  }
};

export const lastMessageFromType = (data: Conversation) => {
  if (data.stats) {
    const { visitorLastMessageCreatedAt: v, operatorLastMessageCreatedAt: o } = data.stats;
    if (v && o) {
      return dayjs(v).isAfter(o) ? '用户' : '客服';
    }
    if (v) {
      return '用户';
    }
    if (o) {
      return '客服';
    }
  }
};

const getFirstMessageCreatedAt = (data: Conversation) => {
  if (data.stats) {
    const { operatorFirstMessageCreatedAt: o, visitorFirstMessageCreatedAt: v } = data.stats;
    if (o && v) {
      return dayjs(o).isBefore(v) ? o : v;
    }
    return o || v;
  }
};

const getLastMessageCreatedAt = (data: Conversation) => {
  if (data.stats) {
    const { operatorLastMessageCreatedAt: o, visitorLastMessageCreatedAt: v } = data.stats;
    if (o && v) {
      return dayjs(o).isAfter(v) ? o : v;
    }
    return o || v;
  }
};

export const firstMessageCreatedAt = flow([getFirstMessageCreatedAt, formatDate]);

export const lastMessageCreatedAt = flow([getLastMessageCreatedAt, formatDate]);

export const chatDuration = (data: Conversation) => {
  const first = getFirstMessageCreatedAt(data);
  const last = getLastMessageCreatedAt(data);
  if (first && last) {
    return dayjs(last).diff(first, 'ms');
  }
};

export const visitorLastMessageCreatedAt = flow([
  get('stats.visitorLastMessageCreatedAt'),
  formatDate,
]);

export const operatorLastMessageCreatedAt = flow([
  get('stats.operatorLastMessageCreatedAt'),
  formatDate,
]);

export const firstOperatorJoinedAt = flow([get('stats.firstOperatorJoinedAt'), formatDate]);

export const operatorFirstMessageCreatedAt = flow([
  get('stats.operatorFirstMessageCreatedAt'),
  formatDate,
]);

export function status(value: number) {
  switch (value) {
    case OperatorStatus.Ready:
      return '在线';
    case OperatorStatus.Busy:
      return '忙碌';
    case OperatorStatus.Leave:
      return '离开';
    default:
      return '未知';
  }
}
