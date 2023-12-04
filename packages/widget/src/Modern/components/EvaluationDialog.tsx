import { useState } from 'react';
import { PiStarFill } from 'react-icons/pi';
import cx from 'classnames';

import { EvaluateData, EvaluationTag } from '../../types';

interface EvaluationDialogProps {
  onEvaluate: (data: EvaluateData) => void;
  onCancel: () => void;
  tag?: EvaluationTag;
}

export function EvaluationDialog({ onEvaluate, onCancel, tag }: EvaluationDialogProps) {
  const [star, setStar] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const tagConfig = tag && (star >= 3 ? tag.positive : tag.negative);
  const tagRequired = tagConfig?.required;
  const canSubmit = tagRequired ? tags.length > 0 : true;

  const handleSubmit = () => {
    if (canSubmit) {
      () =>
        onEvaluate({
          star,
          feedback: feedback.trim() || undefined,
          tags: tags.length ? tags : undefined,
        });
    }
  };

  return (
    <div className="bg-white m-auto rounded-md w-[80%] max-w-[400px] max-h-full text-sm overflow-auto flex flex-col items-center p-4">
      <div className="font-bold mb-4">请您评价我的服务</div>
      <div className="flex flex-wrap justify-center gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            onClick={() => {
              setStar(score);
              setTags([]);
            }}
          >
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

      <div className="font-bold mt-4">建议与反馈</div>
      {tagConfig && tagConfig.options.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 justify-center">
          {tagConfig.options.map((tag) => {
            const active = tags.includes(tag);
            return (
              <button
                key={tag}
                className={cx(
                  'h-6 px-2 rounded-sm text-xs',
                  active ? 'bg-primary text-white' : 'bg-[rgb(243,244,246)] text-[rgb(83,90,103)]',
                )}
                onClick={() => {
                  if (active) {
                    setTags((tags) => tags.filter((_tag) => _tag !== tag));
                  } else {
                    setTags([tag]);
                  }
                }}
              >
                {tag}
              </button>
            );
          })}

          {tagRequired && <div className="text-center text-gray-400 text-xs">请选择一项</div>}
        </div>
      )}
      <textarea
        className="border rounded resize-none outline-none focus:border-primary w-full p-2 mt-4"
        rows={2}
        placeholder="感谢您的反馈，我们会更加努力。"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value.slice(0, 200))}
      />

      <div className="w-full mt-4 flex gap-2">
        <button className="w-full h-9 text-primary border rounded" onClick={onCancel}>
          取消
        </button>
        <button
          className="w-full h-9 bg-primary text-white rounded disabled:bg-gray-300"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          提交
        </button>
      </div>
    </div>
  );
}
