export interface GreetingConfig {
  enabled: boolean;
  message: {
    text: string;
  };
}

export interface NoReadyOperatorMessageConfig {
  enabled: boolean;
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
    enabled: boolean;
    text: string;
  };
  queuedMessage: {
    enabled: boolean;
    text: string;
  };
}

export interface ConfigKeys {
  greeting: GreetingConfig;
  noReadyOperatorMessage: NoReadyOperatorMessageConfig;
  autoClose: AutoCloseConfig;
  queue: QueueConfig;
}
