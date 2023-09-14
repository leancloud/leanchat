export function expand(
  value: string,
  env: Record<string, string | undefined>,
  depth = 0,
) {
  if (depth >= 5) {
    return '';
  }

  const regex = /(?<!\\)\${([^}]+)}/g;
  let result = value;
  let match: RegExpExecArray | null = null;

  while ((match = regex.exec(value)) !== null) {
    const varName = match[1];
    const varValue = env[varName];
    if (varValue) {
      result =
        result.slice(0, match.index) +
        varValue +
        result.slice(match.index + match[0].length);
    }
  }

  if (regex.test(result)) {
    result = expand(result, env, depth + 1);
  }

  return result;
}
