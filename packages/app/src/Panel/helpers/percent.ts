interface PercentOptions {
  placeholder?: string;
  fixed?: number;
}

export function percent(
  part?: number,
  whole?: number,
  { placeholder = '-', fixed = 2 }: PercentOptions = {},
) {
  if (part !== undefined && whole !== undefined && whole > 0) {
    const v = (part / whole) * 100;
    const s = fixed > 0 ? v.toFixed(fixed) : Math.floor(v).toString();
    return s + '%';
  }
  return placeholder;
}
