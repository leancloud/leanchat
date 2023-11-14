export interface GreetingConfig {
  enabled: boolean;
  message: {
    text: string;
  };
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
  greeting: GreetingConfig;
  noReadyOperatorMessage: NoReadyOperatorMessageConfig;
  autoClose: AutoCloseConfig;
  queue: QueueConfig;
}
