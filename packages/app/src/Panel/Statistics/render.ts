import { cond, constant, defaultTo, eq, get, has, map, over, stubTrue, sum } from 'lodash/fp';
import dayjs from 'dayjs';

import { flow, formatDate, toSeconds } from '@/Panel/Statistics/helpers';
import {
  Conversation,
  ConsultationResult,
  OperatorStatus,
  Message,
  UserType,
  MessageType,
} from '../types';

export const id = get('id');

export const createdAt = flow([get('createdAt'), formatDate]);

export const closedAt = flow([get('closedAt'), formatDate]);

export const visitorId = get('visitorId');

export const operatorId = get('operatorId');

export const operatorName = (getOperatorName: (id: string) => string | undefined) =>
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

export function renderMessage(
  getOperatorName: (id: string) => string | undefined,
  getChatbotName: (id: string) => string | undefined,
) {
  return (message: Message) => {
    let text = '';

    switch (message.from.type) {
      case UserType.System:
        text += '系统';
        break;
      case UserType.Visitor:
        text += `用户(${message.from.id})`;
        break;
      case UserType.Operator:
        const operatorName = getOperatorName(message.from.id);
        if (operatorName) {
          text += `客服(${operatorName})`;
        } else {
          text += '客服';
        }
        break;
      case UserType.Chatbot:
        const chatbotName = getChatbotName(message.from.id);
        text += chatbotName ? `机器人(${chatbotName})` : '机器人';
        break;
      default:
        text += '未知';
    }

    text += ' ' + dayjs(message.createdAt).format('YYYY-MM-DD HH:mm:ss');

    text += '\n';
    switch (message.type) {
      case MessageType.Message:
        if (message.data.text) {
          text += message.data.text;
        } else if (message.data.file) {
          text += '[文件]';
        } else {
          text += '[未知消息]';
        }
        break;
      case MessageType.Evaluate:
        text += '[评价]';
        break;
      case MessageType.Assign:
        text += '[分配客服]';
        break;
      case MessageType.Close:
        text += '[关闭会话]';
        break;
      case MessageType.Reopen:
        text += '[重新打开]';
        break;
      default:
        text += '[未知消息类型]';
    }
    return text;
  };
}
