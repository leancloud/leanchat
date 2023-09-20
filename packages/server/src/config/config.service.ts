import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { Injectable } from '@nestjs/common';
import { LRUCache } from 'lru-cache';

import { Config } from './config.model';
import { AutoCloseConversationConfig, GreetingConfig } from './interfaces';

@Injectable()
export class ConfigService {
  private cache: LRUCache<string, any>;

  @InjectModel(Config)
  private configModel: ReturnModelType<typeof Config>;

  constructor() {
    this.cache = new LRUCache({
      max: 100,
      ttl: 1000 * 10,
    });
  }

  async setConfig(key: string, value: any) {
    await this.configModel
      .findOneAndUpdate(
        { key },
        {
          $set: { value },
        },
        {
          upsert: true,
          new: true,
        },
      )
      .exec();

    this.cache.delete(key);
  }

  async getConfig<T = any>(key: string) {
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }

    const config = await this.configModel.findOne({ key });

    if (config) {
      this.cache.set(key, config.value);
      return config.value as T;
    }
  }

  getGreetingConfig() {
    return this.getConfig<GreetingConfig>('greeting');
  }

  setGreetingConfig(value: GreetingConfig) {
    return this.setConfig('greeting', value);
  }

  setAutoCloseConversationConfig(value: AutoCloseConversationConfig) {
    return this.setConfig('autoCloseConversation', value);
  }

  getAutoCloseConversationConfig() {
    return this.getConfig<AutoCloseConversationConfig>('autoCloseConversation');
  }
}
