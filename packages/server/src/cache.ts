type FetchFunc<T> = () => T | Promise<T>;

interface CacheStore<T> {
  get: FetchFunc<T | undefined>;
  set: (value: T) => void | Promise<void>;
}

interface CacheConfig<T, S extends CacheStore<T>> {
  store: S;
  fetch: FetchFunc<T>;
}

export class Cache<T, S extends CacheStore<T>> {
  readonly store: S;
  readonly fetch: FetchFunc<T>;

  constructor(config: CacheConfig<T, S>) {
    this.store = config.store;
    this.fetch = config.fetch;
  }

  async get() {
    const cacheValue = await this.store.get();
    if (cacheValue) {
      return cacheValue;
    }
    const value = await this.fetch();
    if (value !== undefined) {
      await this.store.set(value);
    }
    return value;
  }
}

export class MemoryStore<T> implements CacheStore<T> {
  private value?: T;
  private setTime = 0;

  constructor(readonly ttl: number = 0) {}

  isFresh() {
    if (this.ttl) {
      return this.setTime + this.ttl > Date.now();
    }
    return true;
  }

  get() {
    if (this.isFresh()) {
      return this.value;
    }
    delete this.value;
  }

  set(value: T) {
    this.value = value;
    this.setTime = Date.now();
  }

  inc(count = 1) {
    if (typeof this.value === 'number') {
      (this.value as number) += count;
    }
  }
}
