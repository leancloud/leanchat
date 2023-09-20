export interface GreetingConfig {
  enabled: boolean;
  message: {
    text: string;
  };
}

export interface AutoCloseConversationConfig {
  timeout: number;
}
