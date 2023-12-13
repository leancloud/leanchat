import { MdStar } from 'react-icons/md';
import cx from 'classnames';

interface EvaluationStarProps {
  className?: string;
  count: number;
}

export function EvaluationStar({ className, count }: EvaluationStarProps) {
  return (
    <div
      className={cx('flex items-center text-yellow-400 text-xs', className)}
      title="用户评价星级"
    >
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <MdStar key={i} />
        ))}
    </div>
  );
}
