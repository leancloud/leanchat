export function bytesToSize(bytes: number) {
  if (bytes === 0) return '0 Byte';
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.floor(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
}
