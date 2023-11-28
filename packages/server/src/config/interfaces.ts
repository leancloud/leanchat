export interface GreetingMessageConfig {
  enabled: boolean;
  text: string;
}

export interface NoReadyOperatorMessageConfig {
  text: string;
}

export interface AutoCloseConfig {
  timeout: number;
  message: {
    enabled: boolean;
    text: string;
  };
}

export interface QueueConfig {
  capacity: number;
  fullMessage: {
    text: string;
  };
  queuedMessage: {
    text: string;
  };
}

export interface ConfigKeys {
  greetingMessage: GreetingMessageConfig;
  noReadyOperatorMessage: NoReadyOperatorMessageConfig;
  autoClose: AutoCloseConfig;
  queue: QueueConfig;
}
