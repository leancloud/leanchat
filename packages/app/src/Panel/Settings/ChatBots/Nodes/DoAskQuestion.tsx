import { useState } from 'react';
import { Input } from 'antd';
import { nanoid } from 'nanoid';
import { useReactFlow } from 'reactflow';
import { produce } from 'immer';

import { withNode } from './Container';
import { NodeHandle } from './NodeHandle';

interface AnswerConfig {
  id: string;
  answer: string;
  nextId?: string;
}

export const DoAskQuestion = withNode('action', () => {
  const [answers, setAnswers] = useState<AnswerConfig[]>(() => {
    return [
      {
        id: nanoid(),
        answer: '',
      },
    ];
  });

  const { setEdges } = useReactFlow();

  const addAnswer = () => {
    setAnswers((prev) => [
      ...prev,
      {
        id: nanoid(),
        answer: '',
      },
    ]);
  };

  const changeAnswer = (id: string, answer: string) => {
    setAnswers((state) => {
      return produce(state, (configs) => {
        for (const config of configs) {
          if (config.id === id) {
            config.answer = answer;
            break;
          }
        }
      });
    });
  };

  const removeAnswer = (id: string) => {
    setAnswers((prev) => prev.filter((a) => a.id !== id));
    setEdges((edges) => edges.filter((e) => e.sourceHandle !== id));
  };

  return (
    <>
      <div className="w-[300px]">
        <div className="p-2 relative">
          询问问题
          <NodeHandle type="target" id="source" />
        </div>
        <div className="px-2">
          <Input.TextArea autoSize />
        </div>
        <div className="p-2">答案 (正则匹配)</div>
        <div className="flex flex-col gap-2">
          {answers.map(({ id, answer }, i) => (
            <div key={id} className="relative px-2">
              <Input
                value={answer}
                onChange={(e) => {
                  changeAnswer(id, e.target.value);
                  if (e.target.value && i === answers.length - 1) {
                    addAnswer();
                  }
                }}
                onBlur={(e) => {
                  if (!e.target.value && answers.length > 1 && i !== answers.length - 1) {
                    removeAnswer(id);
                  }
                }}
              />
              {answer.length > 0 && <NodeHandle type="source" id={id} />}
            </div>
          ))}
        </div>

        <div className="relative p-2 flex flex-row-reverse">
          无匹配
          <NodeHandle type="source" id="noMatch" />
        </div>
      </div>
    </>
  );
});
