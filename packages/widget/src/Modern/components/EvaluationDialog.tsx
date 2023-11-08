import { useState } from 'react';
import { PiStarFill } from 'react-icons/pi';
import cx from 'classnames';

interface Evaluation {
  star: number;
  feedback: string;
}

interface EvaluationDialogProps {
  onEvaluate: (data: Evaluation) => void;
  onCancel: () => void;
}

export function EvaluationDialog({ onEvaluate, onCancel }: EvaluationDialogProps) {
  const [star, setStar] = useState(5);
  const [feedback, setFeedback] = useState('');

  return (
    <div className="bg-white m-auto rounded-md w-[80%] max-w-[400px] text-sm">
      <div className="flex flex-col items-center p-4">
        <div className="font-bold mb-4">请您评价我的服务</div>
        <div className="flex flex-wrap justify-center gap-2">
          {[1, 2, 3, 4, 5].map((score) => (
            <button key={score} onClick={() => setStar(score)}>
              <PiStarFill
                className={cx('w-9 h-9', {
                  'text-primary': star >= score,
                  'text-gray-300': star < score,
                })}
              />
            </button>
          ))}
        </div>
        <div className="text-primary mt-2">
          {['非常不满意', '不满意', '一般', '满意', '非常满意'][star - 1]}
        </div>
        <div className="py-2 font-bold mt-4 mb-2">建议与反馈</div>
        <textarea
          className="border rounded resize-none outline-none focus:border-primary w-full p-2"
          rows={3}
          placeholder="感谢您的反馈，我们会更加努力。"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value.slice(0, 200))}
        />
      </div>
      <div className="divide-x flex border-t text-primary">
        <button className="flex-1 h-12" onClick={onCancel}>
          取消
        </button>
        <button className="flex-1 h-12" onClick={() => onEvaluate({ star, feedback })}>
          评价
        </button>
      </div>
    </div>
  );
}
