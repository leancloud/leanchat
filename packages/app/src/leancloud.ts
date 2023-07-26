import AV from 'leancloud-storage';

AV.init({
  appId: import.meta.env.VITE_LEANCLOUD_APP_ID,
  appKey: import.meta.env.VITE_LEANCLOUD_APP_KEY,
  serverURL: import.meta.env.VITE_LEANCLOUD_API_SERVER,
});

(AV as any)._config.disableCurrentUser = true;

export default AV;
