import { ReactNode, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Checkbox, DatePicker, Input, InputNumber, Select, Table } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';

import { ChannelSelect } from './components/ChannelSelect';
import { OperatorSelect } from '../components/OperatorSelect';
import { CategoryCascader } from '../components/CategoryCascader';
import { GetConversationRecordStatsOptions, getConversationRecordStats } from '../api/statistics';
import { useCategories } from '../hooks/category';

interface FilterGroupProps {
  label?: ReactNode;
  children?: ReactNode;
}

function FilterGroup({ label, children }: FilterGroupProps) {
  return (
    <div className="grid grid-cols-[66px_1fr]">
      <div className="leading-8">{label}</div>
      <div>{children}</div>
    </div>
  );
}

interface ExtraData {
  visitor: {
    type: 'id' | 'name';
    value?: string;
  };
  keyword: {
    type: 'visitor' | 'operator';
    value?: string;
  };
  duration: {
    type: 'gt' | 'lt';
    value?: number;
  };
  averageResponseTime: {
    type: 'gt' | 'lt';
    value?: number;
  };
  categoryId?: string;
  evaluationStar?: number;
}

interface FilterFormData {
  from: Date;
  to: Date;
  channel?: string;
  operatorId?: string;
  visitorId?: string;
  extra?: ExtraData;
}

interface FilterFormInternalData {
  timeRange?: [dayjs.Dayjs, dayjs.Dayjs];
  channel?: string;
  operatorId?: string;
  visitorId?: string;
  extra?: ExtraData;
}

interface FilterFormProps {
  onChange: (data: FilterFormData) => void;
}

function FilterForm({ onChange }: FilterFormProps) {
  const [data, setData] = useState<FilterFormInternalData>({});
  const [extraEnabled, setExtraEnabled] = useState(false);

  const [extra, setExtra] = useState<ExtraData>({
    visitor: { type: 'id' },
    keyword: { type: 'operator' },
    duration: { type: 'gt' },
    averageResponseTime: { type: 'gt' },
  });

  const handleReset = () => {
    setData({});
    setExtra({
      visitor: { type: 'id' },
      keyword: { type: 'operator' },
      duration: { type: 'gt' },
      averageResponseTime: { type: 'gt' },
    });
  };

  const handleChange = () => {
    if (!data.timeRange) {
      return;
    }

    onChange({
      from: data.timeRange[0].toDate(),
      to: data.timeRange[1].toDate(),
      channel: data.channel,
      operatorId: data.operatorId,
      visitorId: data.visitorId,
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <DatePicker.RangePicker
          value={data.timeRange}
          onChange={(timeRange) =>
            setData({ ...data, timeRange: timeRange as [dayjs.Dayjs, dayjs.Dayjs] })
          }
        />

        <ChannelSelect value={data.channel} onChange={(channel) => setData({ ...data, channel })} />

        <OperatorSelect
          allowClear
          placeholder="最后接待人工客服"
          value={data.operatorId}
          onChange={(operatorId) => setData({ ...data, operatorId })}
        />

        <Checkbox checked={extraEnabled} onChange={(e) => setExtraEnabled(e.target.checked)}>
          更多筛选
        </Checkbox>
      </div>

      {extraEnabled && (
        <div className="mt-3 border bg-[#f7f7f7] rounded p-4 space-y-3">
          <FilterGroup label="客户筛选">
            <Input
              allowClear
              addonBefore={
                <Select
                  options={[
                    { label: '客户ID', value: 'id' },
                    { label: '客户昵称', value: 'name' },
                  ]}
                  value={extra.visitor.type}
                  onChange={(type) => setExtra({ ...extra, visitor: { ...extra.visitor, type } })}
                  style={{ width: 140, textAlign: 'left' }}
                />
              }
              value={extra.visitor.value}
              onChange={(e) =>
                setExtra({ ...extra, visitor: { ...extra.visitor, value: e.target.value } })
              }
              style={{ width: 360 }}
            />
          </FilterGroup>

          <FilterGroup label="会话筛选">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                allowClear
                addonBefore={
                  <Select
                    options={[
                      { label: '客服会话内容', value: 'operator' },
                      { label: '用户会话内容', value: 'visitor' },
                    ]}
                    value={extra.keyword.type}
                    onChange={(type) => setExtra({ ...extra, keyword: { ...extra.keyword, type } })}
                    style={{ width: 140, textAlign: 'left' }}
                  />
                }
                value={extra.keyword.value}
                onChange={(e) =>
                  setExtra({ ...extra, keyword: { ...extra.keyword, value: e.target.value } })
                }
                style={{ width: 360 }}
              />
              <div className="flex items-center shrink-0">
                <div className="mr-2">会话持续时长</div>
                <InputNumber
                  addonBefore={
                    <Select
                      options={[
                        { label: '大于', value: 'gt' },
                        { label: '小于', value: 'lt' },
                      ]}
                      value={extra.duration.type}
                      onChange={(type) =>
                        setExtra({ ...extra, duration: { ...extra.duration, type } })
                      }
                      style={{ width: 80, textAlign: 'left' }}
                    />
                  }
                  value={extra.duration.value}
                  onChange={(value) =>
                    setExtra({
                      ...extra,
                      duration: { ...extra.duration, value: value ?? undefined },
                    })
                  }
                  suffix="秒"
                  style={{ width: 200 }}
                />
              </div>
              <div className="flex items-center shrink-0">
                <div className="mr-2">会话平均响应时长</div>
                <InputNumber
                  addonBefore={
                    <Select
                      options={[
                        { label: '大于', value: 'gt' },
                        { label: '小于', value: 'lt' },
                      ]}
                      value={extra.averageResponseTime.type}
                      onChange={(type) =>
                        setExtra({
                          ...extra,
                          averageResponseTime: { ...extra.averageResponseTime, type },
                        })
                      }
                      style={{ width: 80, textAlign: 'left' }}
                    />
                  }
                  value={extra.averageResponseTime.value}
                  onChange={(value) =>
                    setExtra({
                      ...extra,
                      averageResponseTime: {
                        ...extra.averageResponseTime,
                        value: value ?? undefined,
                      },
                    })
                  }
                  suffix="秒"
                  style={{ width: 200 }}
                />
              </div>
            </div>
            <div className="mt-2">
              <CategoryCascader
                placeholder="会话分类"
                categoryId={extra.categoryId}
                onCategoryIdChange={(categoryId) => setExtra({ ...extra, categoryId })}
              />
            </div>
          </FilterGroup>

          <FilterGroup label="评价筛选">
            <Select
              allowClear
              options={[5, 4, 3, 2, 1].map((value) => ({ label: '⭐️'.repeat(value), value }))}
              placeholder="五星评价"
              value={extra.evaluationStar}
              onChange={(evaluationStar) => setExtra({ ...extra, evaluationStar })}
              style={{ width: 120 }}
            />
          </FilterGroup>
        </div>
      )}

      <div className="mt-3 space-x-2">
        <Button type="primary" onClick={handleChange}>
          查询
        </Button>
        <Button onClick={handleReset}>重置</Button>
      </div>
    </div>
  );
}

function renderDuration(ms?: number) {
  if (ms === undefined) {
    return '-';
  }
  const second = Math.floor(ms / 1000);
  const minute = Math.floor(second / 60);
  if (minute) {
    return `${minute}分${second % 60}秒`;
  }
  return `${second}秒`;
}

function renderDate(date?: string) {
  if (date === undefined) {
    return '-';
  }
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

export function ConversationRecord() {
  const [options, setOptions] = useState<GetConversationRecordStatsOptions>();

  const { data } = useQuery({
    enabled: !!options,
    queryKey: ['ConversationRecordStats', options],
    queryFn: () => getConversationRecordStats(options!),
  });

  const { data: categories } = useCategories();
  const categoryMap = useMemo(() => _.keyBy(categories, (c) => c.id), [categories]);
  const getCategoryPath = (id: string): string[] => {
    const category = categoryMap[id];
    if (category) {
      if (category.parentId) {
        return [...getCategoryPath(category.parentId), category.name];
      }
      return [category.name];
    }
    return [];
  };

  return (
    <div>
      <FilterForm
        onChange={(data) => {
          setOptions({
            from: data.from.toISOString(),
            to: data.to.toISOString(),
          });
        }}
      />
      <Table
        className="mt-5"
        dataSource={data}
        rowKey="id"
        scroll={{ x: 'max-content' }}
        columns={[
          {
            dataIndex: 'id',
            title: '会话ID',
          },
          {
            dataIndex: 'createdAt',
            title: '会话开始时间',
            render: renderDate,
          },
          {
            dataIndex: ['timestamps', 'closedAt'],
            title: '会话结束时间',
            render: renderDate,
          },
          {
            dataIndex: 'visitorId',
            title: '客户ID',
          },
          {
            dataIndex: 'categoryId',
            title: '分类',
            render: (categoryId: string) => getCategoryPath(categoryId).join(' / ') || '-',
          },
          {
            dataIndex: ['evaluation', 'star'],
            title: '满意度',
            render: (star: number = 0) => {
              return {
                0: '未评价',
                1: '非常不满意',
                2: '不满意',
                3: '一般',
                4: '满意',
                5: '非常满意',
              }[star];
            },
          },
          {
            key: 'messageCount',
            title: '总会话消息数',
            render: (record) => {
              const visitor = record.stats.visitorMessageCount || 0;
              const operator = record.stats.operatorMessageCount || 0;
              return `${visitor + operator}(用户${visitor},客服${operator})`;
            },
          },
          {
            dataIndex: ['stats', 'duration'],
            title: '会话总时长',
            render: renderDuration,
          },
          {
            dataIndex: ['stats', 'firstResponseTime'],
            title: '首次响应时长',
            render: renderDuration,
          },
          {
            key: 'firstMessageFrom',
            title: '第一次发言者',
            render: ({ timestamps: { operatorFirstMessageAt, visitorFirstMessageAt } }) => {
              if (operatorFirstMessageAt && visitorFirstMessageAt) {
                return dayjs(operatorFirstMessageAt).isBefore(visitorFirstMessageAt)
                  ? '客服'
                  : '用户';
              } else if (operatorFirstMessageAt) {
                return '客服';
              } else if (visitorFirstMessageAt) {
                return '用户';
              } else {
                return '-';
              }
            },
          },
          {
            key: 'lastMessageFrom',
            title: '最后发言者',
            render: ({ timestamps: { operatorLastMessageAt, visitorLastMessageAt } }) => {
              if (operatorLastMessageAt && visitorLastMessageAt) {
                return dayjs(operatorLastMessageAt).isAfter(visitorLastMessageAt) ? '客服' : '用户';
              } else if (operatorLastMessageAt) {
                return '客服';
              } else if (visitorLastMessageAt) {
                return '用户';
              } else {
                return '-';
              }
            },
          },
          {
            dataIndex: ['timestamps', 'visitorLastMessageAt'],
            title: '用户最后消息时间',
            render: renderDate,
          },
          {
            dataIndex: ['timestamps', 'operatorLastMessageAt'],
            title: '客服最后消息时间',
            render: renderDate,
          },
        ]}
      />
    </div>
  );
}
