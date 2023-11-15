import { ConfigKeys } from './interfaces';

export const DEFAULT_CONFIGS: Partial<ConfigKeys> = {
  noReadyOperatorMessage: {
    text: '抱歉，目前没有客服在线 😓',
  },
  queue: {
    capacity: 0,
    queuedMessage: {
      text: '您已进入排队系统，您排在第 {{ queue.position }} 位。',
    },
    fullMessage: {
      text: '您好，当前排队人数较多，请您稍后再试。',
    },
  },
};
