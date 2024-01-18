import { useEffect, useState } from 'react';
import { Modal } from 'antd';
import cx from 'classnames';

export interface ReorderModalProps {
  open?: boolean;
  onCancel?: () => void;
  questions?: { id: string; question: string }[];
  onSave: (ids: string[]) => void;
}

export function ReorderModal({ open, onCancel, questions, onSave }: ReorderModalProps) {
  const [tempQuestions, setTempQuestions] = useState(questions || []);
  useEffect(() => {
    if (questions) {
      setTempQuestions(questions);
    }
  }, [open]);

  const swap = (index1: number, index2: number) => {
    if (index1 > index2) {
      [index1, index2] = [index2, index1];
    }
    setTempQuestions((questions) => [
      ...questions.slice(0, index1),
      questions[index2],
      ...questions.slice(index1 + 1, index2),
      questions[index1],
      ...questions.slice(index2 + 1),
    ]);
  };

  return (
    <Modal
      destroyOnClose
      open={open}
      title="调整顺序"
      onCancel={onCancel}
      onOk={() => onSave(tempQuestions.map((q) => q.id))}
    >
      <div className="border rounded divide-y">
        {tempQuestions.map((q, index) => (
          <div key={q.id} className="flex items-center px-3 py-2 gap-1">
            <div className={cx('grow truncate', !q.question && 'text-gray-400 italic')}>
              {q.question || '匹配所有'}
            </div>
            {index > 0 && (
              <button className="text-xs text-primary" onClick={() => swap(index, index - 1)}>
                上移
              </button>
            )}
            {index < tempQuestions.length - 1 && (
              <button className="text-xs text-primary" onClick={() => swap(index, index + 1)}>
                下移
              </button>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
