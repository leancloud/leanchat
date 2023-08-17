export function parseRedisUrl(redisUrl: string) {
  const { password, hostname, port, pathname } = new URL(redisUrl);
  return {
    host: hostname,
    port: parseInt(port),
    password,
    db: pathname ? parseInt(pathname.slice(1)) : undefined,
  };
}
