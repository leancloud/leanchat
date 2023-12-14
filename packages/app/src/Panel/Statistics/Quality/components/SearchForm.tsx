import { useState } from 'react';
import { Button, Checkbox, DatePicker, Form, Input, Radio, Select } from 'antd';
import { Dayjs } from 'dayjs';
import { last } from 'lodash/fp';

import { CategoryCascader } from '@/Panel/components/CategoryCascader';
import { OperatorSelect } from '@/Panel/components/OperatorSelect';
import { UserType } from '@/Panel/types';

export interface SearchFormData {
  id?: string;
  date?: [Dayjs, Dayjs];
  message?: {
    text?: string;
  };
  categoryId?: string;
  visitorId?: string;
  operatorId?: string[];
  closedBy?: number;
  evaluation?: {
    invited?: boolean;
    star?: number;
  };
}

interface SearchFormProps {
  initData?: Partial<SearchFormData>;
  onSubmit?: (data: SearchFormData) => void;
}

export function SearchForm({ initData, onSubmit }: SearchFormProps) {
  const [mode, setMode] = useState<'normal' | 'advance' | 'id'>('normal');

  return (
    <div>
      <div className="flex justify-center mb-4">
        <Radio.Group
          optionType="button"
          options={[
            { label: '根据条件搜索', value: 'searchByFilters' },
            { label: '根据 ID 搜索', value: 'searchById' },
          ]}
          value={mode === 'id' ? 'searchById' : 'searchByFilters'}
          onChange={(e) => setMode(e.target.value === 'searchById' ? 'id' : 'normal')}
        />
      </div>

      <Form
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        initialValues={initData}
        onFinish={onSubmit}
      >
        {mode !== 'id' && (
          <Form.Item label="日期" name="date" rules={[{ required: true }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
        )}

        {mode === 'id' && (
          <Form.Item label="ID" name="id" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        )}

        {mode === 'advance' && (
          <>
            <Form.Item label="关键词" name={['message', 'text']}>
              <Input />
            </Form.Item>
            <Form.Item
              label="分类"
              name="categoryId"
              valuePropName="categoryId"
              getValueFromEvent={last}
            >
              <CategoryCascader />
            </Form.Item>
            <Form.Item label="用户ID" name="visitorId">
              <Input />
            </Form.Item>
            <Form.Item label="负责客服" name="operatorId">
              <OperatorSelect allowClear mode="multiple" />
            </Form.Item>
            <Form.Item label="咨询结束人" name="closedBy">
              <Select
                allowClear
                options={[
                  { label: '客服', value: UserType.Operator },
                  { label: '用户', value: UserType.Visitor },
                  { label: '系统', value: UserType.System },
                ]}
              />
            </Form.Item>
            <Form.Item label="评价方式" name={['evaluation', 'invited']}>
              <Select
                allowClear
                options={[
                  { label: '主动评价', value: false },
                  { label: '邀请评价', value: true },
                ]}
              />
            </Form.Item>
            <Form.Item label="满意度" name={['evaluation', 'star']}>
              <Select
                allowClear
                options={[
                  { label: '非常满意', value: 5 },
                  { label: '满意', value: 4 },
                  { label: '一般', value: 3 },
                  { label: '不满意', value: 2 },
                  { label: '非常不满意', value: 1 },
                ]}
              />
            </Form.Item>
          </>
        )}

        <Form.Item wrapperCol={{ offset: 6 }}>
          <div className="flex items-center">
            {mode !== 'id' && (
              <Checkbox
                checked={mode === 'advance'}
                onChange={(e) => setMode(e.target.checked ? 'advance' : 'normal')}
              >
                高级搜索
              </Checkbox>
            )}
            <div className="ml-auto space-x-2">
              <Button type="primary" htmlType="submit">
                搜索
              </Button>
            </div>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
}
