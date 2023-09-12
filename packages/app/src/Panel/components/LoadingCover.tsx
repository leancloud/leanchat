import { Spin } from 'antd';

interface LoadingCoverProps {
  minHeight?: number;
}

export function LoadingCover({ minHeight }: LoadingCoverProps) {
  return (
    <div
      className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-60"
      style={{
        minHeight,
      }}
    >
      <Spin />
    </div>
  );
}
