import { useMemo } from 'react';
import _ from 'lodash';

type Selector<TIn, TOut> = (input: TIn) => TOut;

type StringKeys<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];

function makeSelector<T>(selector: Selector<T, string> | StringKeys<T>): Selector<T, string> {
  if (typeof selector === 'string') {
    return ((value: T) => value[selector]) as any;
  }
  return selector as any;
}

export function useSelector<T>(
  data: T[] | undefined,
  keySelector: Selector<T, string> | StringKeys<T>,
): Selector<string, T | undefined>;
export function useSelector<T, K extends keyof T>(
  data: T[] | undefined,
  keySelector: Selector<T, string> | StringKeys<T>,
  valueSelector: K,
): Selector<string, T[K] | undefined>;
export function useSelector<T, U>(
  data: T[] | undefined,
  keySelector: Selector<T, string> | StringKeys<T>,
  valueSelector: Selector<T, U>,
): Selector<string, U | undefined>;
export function useSelector(data: any[] | undefined, keySelector: any, valueSelector?: any) {
  return useMemo(() => {
    if (!data || data.length === 0) {
      return () => undefined;
    }

    const map = _.keyBy(data, keySelector);

    const getValue = makeSelector(valueSelector);

    if (valueSelector) {
      return (key: string) => {
        const value = map[key];
        if (value !== undefined) {
          return getValue(value);
        }
      };
    }

    return (key: string) => map[key];
  }, [data, keySelector, valueSelector]);
}
