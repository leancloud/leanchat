import AV from 'leancloud-storage';

AV.init({
  appId: import.meta.env.VITE_LEANCLOUD_APP_ID,
  appKey: import.meta.env.VITE_LEANCLOUD_APP_KEY,
  serverURL: import.meta.env.VITE_LEANCLOUD_API_SERVER,
});

interface UploadFileOptions {
  onProgress: (e: { percent?: number }) => void;
}

export async function uploadFile(file: File, options?: UploadFileOptions) {
  const avFile = new AV.File(file.name, file);
  await avFile.save({
    onprogress: options?.onProgress,
  });
  return avFile.id!;
}
