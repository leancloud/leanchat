import { ReactNode, useEffect, useRef } from 'react';

interface StatsCardProps {
  title: string;
  value: ReactNode;
}

export function StatsCard({ title, value }: StatsCardProps) {
  const cardRef = useRef<HTMLDivElement>(null!);
  const valueRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const valueElement = valueRef.current;
    const cardElement = cardRef.current;
    if (valueElement.offsetWidth < cardElement.clientWidth) {
      return;
    }
    valueElement.style.transform = `scale(${cardElement.clientWidth / valueElement.offsetWidth})`;
  }, [value]);

  return (
    <div
      ref={cardRef}
      className="border bg-[#f7f7f7] w-[180px] h-[100px] flex flex-col justify-center items-center"
    >
      <div className="text-sm leading-[14px]">{title}</div>
      <div ref={valueRef} className="text-[28px] leading-[28px] mt-[10px] break-keep">
        {value}
      </div>
    </div>
  );
}
