import { useCallback, useEffect, useRef, useState } from 'react';

import { useEffectEvent } from './useEffectEvent';

enum TaskStatus {
  Ready,
  Loading,
  Error,
  Done,
  Aborted,
}

class ExportDataTask<TData> {
  status: TaskStatus = TaskStatus.Ready;

  private data: TData[] = [];

  private stop = false;

  constructor(
    private fetchData: (cursor?: any) => Promise<TData>,
    private getNextCursor: (lastData: TData, allData: TData[]) => any,
    private onProgress: (currentData: TData, data: TData[]) => void,
    private onSuccess: (data: TData[]) => void,
    private onError: (error: any) => void,
    private delay = 0,
  ) {}

  async start() {
    if (this.status !== TaskStatus.Ready) {
      return;
    }
    this.status = TaskStatus.Loading;
    this.safeFetch();
  }

  async cancel() {
    this.stop = true;
  }

  private async safeFetch() {
    try {
      await this.fetch();
    } catch (error) {
      this.status = TaskStatus.Error;
      this.onError(error);
    }
  }

  private async fetch() {
    let cursor: any;
    if (this.data.length) {
      cursor = this.getNextCursor(this.data[this.data.length - 1], this.data);
      if (cursor === undefined) {
        this.status = TaskStatus.Done;
        this.onSuccess(this.data);
        return;
      }
    }

    const _data = await this.fetchData(cursor);
    if (this.stop) {
      this.status = TaskStatus.Aborted;
      return;
    }
    this.data.push(_data);
    this.onProgress(_data, this.data);
    setTimeout(() => this.safeFetch(), this.delay);
  }
}

export interface UseExportDataOptions<TData> {
  fetchData: (cursor?: any) => Promise<TData>;
  getNextCursor: (lastData: TData, allData: TData[]) => any;
  onProgress: (currentData: TData, allData: TData[]) => void;
  onSuccess: (data: TData[]) => void;
  delay?: number;
}

export interface UseExportDataReturns<TData> {
  data: TData[];
  isLoading: boolean;
  error?: any;
  exportData: () => void;
  cancel: () => void;
}

export function useExportData<TData>({
  fetchData,
  getNextCursor,
  onProgress,
  onSuccess,
  delay,
}: UseExportDataOptions<TData>): UseExportDataReturns<TData> {
  const [state, setState] = useState<{ data: TData[]; isLoading: boolean; error?: any }>({
    data: [],
    isLoading: false,
  });

  const taskRef = useRef<ExportDataTask<TData>>();

  useEffect(() => {
    return () => {
      taskRef.current?.cancel();
    };
  }, []);

  const _onProgress = useEffectEvent(onProgress);
  const _onSuccess = useEffectEvent(onSuccess);

  const exportData = useCallback(() => {
    taskRef.current?.cancel();
    setState({ data: [], isLoading: true });
    const task = new ExportDataTask(
      fetchData,
      getNextCursor,
      (currentData, data) => {
        _onProgress(currentData, data);
        setState((state) => ({ ...state, data }));
      },
      (data) => {
        _onSuccess(data);
        setState((state) => ({ ...state, data, isLoading: false }));
      },
      (error) => {
        setState((state) => ({ ...state, error, isLoading: false }));
      },
      delay,
    );
    task.start();
    taskRef.current = task;
  }, [fetchData, getNextCursor]);

  const cancel = useCallback(() => {
    taskRef.current?.cancel();
    setState((state) => ({ ...state, isLoading: false }));
  }, []);

  return {
    ...state,
    exportData,
    cancel,
  };
}
