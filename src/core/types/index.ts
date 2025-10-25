// Core Types
export interface AppConfig {
  apiKeys: {
    openai: string;
  };
  features: {
    voiceAssistant: boolean;
    multilingual: boolean;
  };
}

export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  VITE_OPENAI_API_KEY: string;
}
