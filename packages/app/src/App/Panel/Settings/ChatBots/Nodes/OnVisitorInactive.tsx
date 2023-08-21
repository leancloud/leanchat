import { InputNumber, Select } from 'antd';

import { withNode } from './Container';
import { NodeHandle } from './NodeHandle';

export const OnVisitorInactive = withNode('event', ({ data, setData }) => {
  const repeatInterval = data.repeatInterval === 60 * 60 * 24 ? '24hours' : 'unlimited';

  return (
    <>
      <div className="p-2 relative">
        用户不活跃
        <NodeHandle type="source" id={`${data.id}.out`} />
      </div>
      <div className="px-2 pb-2">
        <div className="mb-2">距上次回复超过</div>
        <InputNumber
          value={data.inactiveDuration / 60}
          onChange={(value) => value && setData((data) => (data.inactiveDuration = value * 60))}
          addonAfter="分钟"
          min={1}
          style={{ width: 150 }}
        />
        <div className="my-2">触发间隔</div>
        <Select
          options={[
            {
              label: '24 小时',
              value: '24hours',
            },
            {
              label: '无限制',
              value: 'unlimited',
            },
          ]}
          value={repeatInterval}
          onChange={(value) =>
            setData((data) => {
              if (value === '24hours') {
                data.repeatInterval = 60 * 60 * 24;
              } else {
                delete data.repeatInterval;
              }
            })
          }
          style={{ width: 150 }}
        />
      </div>
    </>
  );
});
