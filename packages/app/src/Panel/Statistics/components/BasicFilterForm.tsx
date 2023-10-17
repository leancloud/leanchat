import { Button, DatePicker, Form } from 'antd';
import dayjs from 'dayjs';

import { OperatorSelect } from '@/Panel/components/OperatorSelect';
import { ChannelSelect } from './ChannelSelect';

export interface BasicFilterFormData {
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];
  channel?: string;
  operatorId?: string[];
}

interface BasicFilterFormProps {
  initData?: Partial<BasicFilterFormData>;
  onChange: (data: BasicFilterFormData) => void;
}

export function BasicFilterForm({ initData, onChange }: BasicFilterFormProps) {
  return (
    <Form layout="inline" initialValues={initData} onFinish={onChange}>
      <Form.Item name="dateRange" rules={[{ required: true }]}>
        <DatePicker.RangePicker />
      </Form.Item>
      <Form.Item name="channel">
        <ChannelSelect allowClear />
      </Form.Item>
      <Form.Item name="operatorId">
        <OperatorSelect mode="multiple" placeholder="人工客服" style={{ minWidth: 120 }} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          查询
        </Button>
        <Button className="ml-2" htmlType="reset">
          重置
        </Button>
      </Form.Item>
    </Form>
  );
}
