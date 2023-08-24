import dayjs from 'dayjs';

export function diffTime(a: number | string, b: number | string) {
  const d1 = dayjs(a);
  const d2 = dayjs(b);
  const years = d1.diff(d2, 'year');
  if (years > 0) {
    return `${years}年`;
  }
  const months = d1.diff(d2, 'month');
  if (months > 0) {
    return `${months}月`;
  }
  const days = d1.diff(d2, 'day');
  if (days > 0) {
    return `${days}日`;
  }
  const hours = d1.diff(d2, 'hour');
  if (hours > 0) {
    return `${hours}小时`;
  }
  const mins = d1.diff(d2, 'minute');
  if (mins > 0) {
    return `${mins}分钟`;
  }
  return '现在';
}
