import dayjs from 'dayjs';

export function diffTime(a: number, b: number) {
  const d1 = dayjs(a);
  const d2 = dayjs(b);
  const months = d1.diff(d2, 'month');
  if (months > 0) {
    return `${months}month`;
  }
  const days = d1.diff(d2, 'day');
  if (days > 0) {
    return `${days}d`;
  }
  const hours = d1.diff(d2, 'hour');
  if (hours > 0) {
    return `${hours}h`;
  }
  const mins = d1.diff(d2, 'minute');
  if (mins > 0) {
    return `${mins}min`;
  }
  return 'now';
}
