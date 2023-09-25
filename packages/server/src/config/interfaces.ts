export interface GreetingConfig {
  enabled: boolean;
  message: {
    text: string;
  };
}

export interface AutoCloseConversationConfig {
  timeout: number;
}

export interface QueueConfig {
  capacity: number;
  fullMessage: {
    enabled: boolean;
    text: string;
  };
  queuedMessage: {
    enabled: boolean;
    text: string;
  };
}

export interface ConfigKeys {
  queue: QueueConfig;
}
