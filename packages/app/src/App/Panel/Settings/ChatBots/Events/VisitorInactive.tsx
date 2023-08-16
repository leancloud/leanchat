import { InputNumber, Select } from 'antd';

export function VisitorInactive() {
  return (
    <div>
      <div className="mb-2">用户未回复</div>
      <InputNumber
        addonAfter={
          <Select
            defaultValue="min"
            options={[
              {
                label: '分钟',
                value: 'min',
              },
            ]}
            onClick={(e) => e.stopPropagation()}
          />
        }
      />
    </div>
  );
}
