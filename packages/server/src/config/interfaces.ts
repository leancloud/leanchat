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

export interface EvaluationConfig {
  tag: {
    positive: {
      options: string[];
      required: boolean;
    };
    negative: {
      options: string[];
      required: boolean;
    };
  };
  timeout?: number;
}

export interface ConfigKeys {
  greetingMessage: GreetingMessageConfig;
  noReadyOperatorMessage: NoReadyOperatorMessageConfig;
  autoClose: AutoCloseConfig;
  queue: QueueConfig;
  evaluation: EvaluationConfig;
}
