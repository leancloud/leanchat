import dayjs from 'dayjs';
import _ from 'lodash';

export function renderTime(ms: number) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));

  let timeString = '';
  if (hours > 0) {
    timeString += hours + '小时';
  }
  if (minutes > 0) {
    timeString += minutes + '分';
  }
  if (seconds > 0 || timeString === '') {
    timeString += seconds + '秒';
  }
  return timeString;
}

export function toSeconds(ms: number) {
  return Math.floor(ms / 1000);
}

export function formatDate(date: string | Date | number) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

type FlowFunc = (value: any) => any;

/**
 * Like _.flow but stop when function returns undefined
 */
export function flow(funcs: FlowFunc[]): FlowFunc {
  return (value) => {
    for (const func of funcs) {
      if (value === undefined) {
        break;
      }
      value = func(value);
    }
    return value;
  };
}

export function sum(funcs: FlowFunc[]): FlowFunc {
  return (value) => {
    let sum = 0;
    for (const func of funcs) {
      const v = func(value);
      if (typeof v === 'number') {
        sum += v;
      }
    }
    return sum;
  };
}

export function divide(func1: FlowFunc, func2: FlowFunc): FlowFunc {
  return (value) => {
    const a = func1(value);
    const b = func2(value);
    if (typeof a === 'number' && typeof b === 'number' && b !== 0) {
      return a / b;
    }
  };
}

export function subtract(func1: FlowFunc, func2: FlowFunc): FlowFunc {
  return (value) => {
    const a = func1(value);
    const b = func2(value);
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }
  };
}

export const toPercent: FlowFunc = (value) => {
  if (typeof value === 'number') {
    return Math.min(100, Math.floor(value * 100)).toFixed(2) + '%';
  }
};

export function percent(current: number, total: number) {
  return Math.min(100, Math.floor((current / total) * 100));
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
