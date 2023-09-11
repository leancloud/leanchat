import { ReactNode } from 'react';

interface StatsGroup {
  title: string;
  children?: ReactNode;
}

export function StatsGroup({ title, children }: StatsGroup) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-bold mb-4">{title}</h2>
      <div className="flex flex-wrap gap-4">{children}</div>
    </div>
  );
}
