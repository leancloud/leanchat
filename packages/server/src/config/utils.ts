function expand(
  value: string,
  env: Record<string, string | undefined>,
  depth = 0,
) {
  if (depth >= 5) {
    return '';
  }

  const regex = /\${([^}]+)}/g;
  let result = value;
  let match: RegExpExecArray | null = null;

  while ((match = regex.exec(value)) !== null) {
    const variableName = match[1];
    const varValue = env[variableName];
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

export function expandEnv(keys?: string[]) {
  const env = { ...process.env };
  const result: Record<string, string | undefined> = {};

  if (!keys) {
    keys = Object.keys(env);
  }

  for (const key of keys) {
    const value = env[key];
    result[key] = value && expand(value, env);
  }

  return result;
}
