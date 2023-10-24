import fs from 'node:fs';

const prefix = 'VITE_';

const envNames = ['LEANCLOUD_APP_ID', 'LEANCLOUD_APP_KEY', 'LEANCLOUD_API_HOST'];

const content = envNames
  .map((name) => [prefix + name, process.env[name]])
  .filter(([, value]) => !!value)
  .map(([name, value]) => `${name}=${value}`)
  .join('\n');

fs.writeFileSync('.env.production', content);
