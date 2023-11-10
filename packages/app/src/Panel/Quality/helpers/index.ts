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

export function formatDate(date: string | Date | number) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

/**
 * Like _.flow but stop when function returns undefined
 */
export function flow(funcs: ((value: any) => any)[]) {
  return (arg: any) => {
    for (const func of funcs) {
      if (arg === undefined) {
        break;
      }
      arg = func(arg);
    }
    return arg;
  };
}

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
