import { useCallback, useRef, useState } from 'react';

import { uploadFile } from '../leancloud';

export interface UploadTask {
  id: number;
  progress: number;
}

interface UseUploadOptions {
  onUploaded: (fileId: string) => void;
}

export function useUpload({ onUploaded }: UseUploadOptions) {
  const nextId = useRef(0);

  const [tasks, setTasks] = useState<UploadTask[]>([]);

  const updateTask = useCallback((id: number, data: Partial<Omit<UploadTask, 'id'>>) => {
    setTasks((tasks) => {
      const index = tasks.findIndex((task) => task.id === id);
      if (index === -1) {
        return tasks;
      }
      return [
        ...tasks.slice(0, index),
        {
          ...tasks[index],
          ...data,
        },
        ...tasks.slice(index + 1),
      ];
    });
  }, []);

  const removeTask = useCallback((id: number) => {
    setTasks((tasks) => tasks.filter((task) => task.id !== id));
  }, []);

  const upload = useCallback(
    (file: File) => {
      // this file could be from another iframe
      // modify it prototype so that the SDK can upload it
      Object.setPrototypeOf(file, File.prototype);

      const task: UploadTask = {
        id: nextId.current++,
        progress: 0,
      };
      setTasks((tasks) => [...tasks, task]);
      uploadFile(file, {
        onProgress: (e) => {
          if (e.percent) {
            updateTask(task.id, { progress: e.percent });
          }
        },
      })
        .then((fileId) => {
          removeTask(task.id);
          onUploaded(fileId);
        })
        .catch((e) => {
          console.error(e);
          removeTask(task.id);
        });
    },
    [updateTask, removeTask, onUploaded],
  );

  return { tasks, upload };
}
