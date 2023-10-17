import { ReactNode, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Controller, FormProvider, useController, useForm, useWatch } from 'react-hook-form';
import { Button, Checkbox, DatePicker, Form, Input, InputNumber, Select, Table } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';

import { ChannelSelect } from './components/ChannelSelect';
import { OperatorSelect } from '../components/OperatorSelect';
import { CategoryCascader } from '../components/CategoryCascader';
import { GetConversationRecordStatsOptions, getConversationRecordStats } from '../api/statistics';
import { useCategories } from '../hooks/category';
import { UserType } from '../types';
import { useOperators } from '../hooks/operator';
import { getEvaluationStarText } from './utils';

interface FilterGroupProps {
  label?: ReactNode;
  children?: ReactNode;
}

function FilterGroup({ label, children }: FilterGroupProps) {
  return (
    <div className="grid grid-cols-[66px_1fr]">
      <div className="leading-8">{label}</div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function DateRangeField() {
  const fromController = useController({ name: 'from', rules: { required: true } });
  const toController = useController({ name: 'to', rules: { required: true } });

  return (
    <DatePicker.RangePicker
      value={[fromController.field.value, toController.field.value]}
      onChange={(values) => {
        fromController.field.onChange(values?.[0] ?? undefined);
        toController.field.onChange(values?.[1] ?? undefined);
      }}
      status={(fromController.fieldState.error || toController.fieldState.error) && 'error'}
    />
  );
}

function KeywordField() {
  const typeController = useController({ name: 'keyword.type', defaultValue: 1 });
  const valueController = useController({ name: 'keyword.value' });

  return (
    <Input
      {...valueController.field}
      allowClear
      addonBefore={
        <Select
          {...typeController.field}
          options={[
            { label: '客服会话内容', value: 1 },
            { label: '用户会话内容', value: 0 },
          ]}
          style={{ width: 140, textAlign: 'left' }}
        />
      }
      style={{ width: 300 }}
    />
  );
}

interface NumberFieldProps {
  name: string;
  label: ReactNode;
  suffix?: ReactNode;
}

function NumberField({ name, label, suffix }: NumberFieldProps) {
  const typeController = useController({ name: `${name}.type`, defaultValue: '>' });
  const valueController = useController({ name: `${name}.value` });

  return (
    <div className="flex items-center">
      <div className="mr-2">{label}</div>
      <InputNumber
        {...valueController.field}
        addonBefore={
          <Select
            {...typeController.field}
            options={[
              { label: '大于', value: '>' },
              { label: '小于', value: '<' },
            ]}
            style={{ width: 70, textAlign: 'left' }}
          />
        }
        suffix={suffix}
        style={{ width: 180 }}
      />
    </div>
  );
}

interface NumberFieldValue {
  type: string;
  value: number;
}

function encodeNumberFieldValue({ type, value }: NumberFieldValue) {
  return `${type}${value * 1000}`;
}

function QueuedField() {
  return (
    <Controller
      name="queued"
      render={({ field }) => (
        <Select
          {...field}
          allowClear
          placeholder="排队情况"
          options={[
            { label: '未排队', value: false },
            { label: '排队', value: true },
          ]}
          style={{ width: 100 }}
        />
      )}
    />
  );
}

function ClosedByField() {
  return (
    <Controller
      name="closedBy"
      render={({ field }) => (
        <Select
          {...field}
          allowClear
          placeholder="会话结束方式"
          options={[
            { label: '客服关闭', value: UserType.Operator },
            { label: '用户关闭', value: UserType.Visitor },
            { label: '系统关闭', value: UserType.System },
          ]}
        />
      )}
    />
  );
}

function ConsultationResultField() {
  return (
    <Controller
      name="consultationResult"
      render={({ field }) => (
        <Select
          {...field}
          allowClear
          placeholder="咨询结果"
          options={[
            { label: '有效咨询', value: 0 },
            { label: '无效咨询', value: 1 },
            { label: '客服无应答', value: 2 },
          ]}
          style={{ width: 150 }}
        />
      )}
    />
  );
}

interface FilterFormData {
  from: dayjs.Dayjs;
  to: dayjs.Dayjs;
  channel?: string;
  operatorId?: string;
  extra?: boolean;
  keyword?: {
    type: number;
    value: string;
  };
  duration?: {
    type: '>' | '<';
    value: number;
  };
  averageResponseTime?: {
    type: '>' | '<';
    value: number;
  };
  evaluationStar?: number;
  queued?: boolean;
  closedBy?: number;
  consultationResult?: number;
  categoryId?: string;
}

interface FilterFormProps {
  initData?: FilterFormData;
  onChange: (data: FilterFormData) => void;
}

function FilterForm({ initData, onChange }: FilterFormProps) {
  const form = useForm({ defaultValues: initData });

  const extra = useWatch({ control: form.control, name: 'extra' });

  return (
    <FormProvider {...form}>
      <Form onFinish={form.handleSubmit(onChange)} onReset={() => form.reset()}>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeField />

          <Controller
            name="channel"
            render={({ field }) => (
              <ChannelSelect {...field} allowClear style={{ minWidth: 120 }} />
            )}
          />

          <Controller
            name="operatorId"
            render={({ field }) => (
              <OperatorSelect
                {...field}
                allowClear
                placeholder="最后接待人工客服"
                style={{ minWidth: 150 }}
              />
            )}
          />

          <Controller
            name="extra"
            render={({ field }) => (
              <Checkbox checked={field.value} onChange={field.onChange}>
                更多筛选
              </Checkbox>
            )}
          />
        </div>

        {extra && (
          <div className="mt-3 border bg-[#f7f7f7] rounded p-4 space-y-3">
            <FilterGroup label="会话筛选">
              <KeywordField />
              <NumberField name="duration" label="会话持续时长" suffix="秒" />
              <NumberField name="averageResponseTime" label="会话平均响应时长" suffix="秒" />
            </FilterGroup>

            <FilterGroup label="评价筛选">
              <Controller
                name="evaluationStar"
                render={({ field }) => (
                  <Select
                    {...field}
                    allowClear
                    options={[5, 4, 3, 2, 1].map((value) => ({
                      label: '⭐️'.repeat(value),
                      value,
                    }))}
                    placeholder="五星评价"
                    style={{ width: 120 }}
                  />
                )}
              />
            </FilterGroup>

            <FilterGroup label="状态情况">
              <QueuedField />
              <ClosedByField />
              <ConsultationResultField />
            </FilterGroup>

            <FilterGroup label="服务总结">
              <Controller
                name="categoryId"
                render={({ field }) => (
                  <CategoryCascader
                    placeholder="会话分类"
                    categoryId={field.value}
                    onCategoryIdChange={field.onChange}
                  />
                )}
              />
            </FilterGroup>
          </div>
        )}

        <div className="mt-3 space-x-2">
          <Button type="primary" htmlType="submit">
            查询
          </Button>
          <Button htmlType="reset">重置</Button>
        </div>
      </Form>
    </FormProvider>
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

function renderDate(date?: string | number | dayjs.Dayjs) {
  if (date === undefined) {
    return '-';
  }
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

export function ConversationRecord() {
  const [formData, setFormData] = useState<FilterFormData>(() => ({
    from: dayjs(),
    to: dayjs(),
  }));

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const options = useMemo(() => {
    const {
      from,
      to,
      channel,
      operatorId,
      extra,
      keyword,
      duration,
      averageResponseTime,
      evaluationStar,
      queued,
      closedBy,
      consultationResult,
    } = formData;

    const options: GetConversationRecordStatsOptions = {
      from: from.startOf('day').toISOString(),
      to: to.endOf('day').toISOString(),
      channel,
      operatorId,
      page,
      pageSize,
    };
    if (extra) {
      if (keyword?.value) {
        options.messageKeyword = keyword.value;
        options.messageFrom = keyword.type;
      }
      if (duration?.value) {
        options.duration = encodeNumberFieldValue(duration);
      }
      if (averageResponseTime?.value) {
        options.averageResponseTime = encodeNumberFieldValue(averageResponseTime);
      }
      options.evaluationStar = evaluationStar;
      options.queued = queued;
      options.closedBy = closedBy;
      options.consultationResult = consultationResult;
      options.categoryId = formData.categoryId;
    }
    return options;
  }, [formData, page, pageSize]);

  const { data, isFetching } = useQuery({
    queryKey: ['ConversationRecordStats', options],
    queryFn: () => getConversationRecordStats(options),
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

  const { data: operators } = useOperators();
  const operatorMap = useMemo(() => _.keyBy(operators, (o) => o.id), [operators]);

  return (
    <div>
      <FilterForm initData={formData} onChange={setFormData} />

      <Table
        className="mt-5"
        dataSource={data?.items}
        rowKey="id"
        scroll={{ x: 'max-content' }}
        loading={isFetching}
        pagination={{
          total: data?.totalCount,
          current: page,
          onChange: (page, pageSize) => {
            setPage(page);
            setPageSize(pageSize);
          },
          showSizeChanger: true,
        }}
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
            dataIndex: 'closedAt',
            title: '会话结束时间',
            render: renderDate,
          },
          {
            dataIndex: 'visitorId',
            title: '用户ID',
          },
          {
            dataIndex: 'visitorName',
            title: '用户名称',
            render: (name) => name || '-',
          },
          {
            dataIndex: 'categoryId',
            title: '分类',
            render: (categoryId: string) => getCategoryPath(categoryId).join(' / ') || '-',
          },
          {
            dataIndex: ['evaluation', 'star'],
            title: '满意度',
            render: getEvaluationStarText,
          },
          {
            key: 'messageCount',
            title: '总会话消息数',
            render: (record) => {
              const visitor = record.stats.visitorMessageCount || 0;
              const operator = record.stats.operatorMessageCount || 0;
              return visitor + operator;
            },
          },
          {
            dataIndex: 'operatorId',
            title: '客服ID',
          },
          {
            key: 'operatorName',
            dataIndex: 'operatorId',
            title: '客服名称',
            render: (operatorId) => {
              const operator = operatorMap[operatorId];
              if (operator) {
                return `${operator.internalName}(${operator.externalName})`;
              }
              return 'unknown';
            },
          },
          {
            dataIndex: ['stats', 'consultationResult'],
            title: '咨询结果',
            render: (result) => ['有效咨询', '无效咨询', '客服无应答'][result],
          },
          {
            dataIndex: 'evaluationInvitedAt',
            title: '是否邀请评价',
            render: (value) => (value ? '已邀请' : '未邀请'),
          },
          {
            dataIndex: ['stats', 'receptionTime'],
            title: '会话总时长',
            render: renderDuration,
          },
          {
            dataIndex: ['stats', 'firstResponseTime'],
            title: '首次响应时长',
            render: renderDuration,
          },
          {
            key: 'firstMessageCreator',
            title: '第一次发言者',
            render: ({
              stats: { operatorFirstMessageCreatedAt, visitorFirstMessageCreatedAt },
            }) => {
              if (operatorFirstMessageCreatedAt && visitorFirstMessageCreatedAt) {
                return dayjs(operatorFirstMessageCreatedAt).isBefore(visitorFirstMessageCreatedAt)
                  ? '客服'
                  : '用户';
              } else if (operatorFirstMessageCreatedAt) {
                return '客服';
              } else if (visitorFirstMessageCreatedAt) {
                return '用户';
              } else {
                return '-';
              }
            },
          },
          {
            key: 'lastMessageCreator',
            title: '最后发言者',
            render: ({ stats: { operatorLastMessageCreatedAt, visitorLastMessageCreatedAt } }) => {
              if (operatorLastMessageCreatedAt && visitorLastMessageCreatedAt) {
                return dayjs(operatorLastMessageCreatedAt).isAfter(visitorLastMessageCreatedAt)
                  ? '客服'
                  : '用户';
              } else if (operatorLastMessageCreatedAt) {
                return '客服';
              } else if (visitorLastMessageCreatedAt) {
                return '用户';
              } else {
                return '-';
              }
            },
          },
          {
            dataIndex: ['stats', 'visitorLastMessageCreatedAt'],
            title: '用户最后消息时间',
            render: renderDate,
          },
          {
            dataIndex: ['stats', 'operatorLastMessageCreatedAt'],
            title: '客服最后消息时间',
            render: renderDate,
          },
          {
            key: 'firstMessageCreatedAt',
            title: '第一条消息时间',
            render: ({
              stats: { operatorFirstMessageCreatedAt, visitorFirstMessageCreatedAt },
            }) => {
              if (operatorFirstMessageCreatedAt && visitorFirstMessageCreatedAt) {
                const d1 = dayjs(operatorFirstMessageCreatedAt);
                const d2 = dayjs(visitorFirstMessageCreatedAt);
                if (d1.isBefore(d2)) {
                  return renderDate(d1);
                } else {
                  return renderDate(d2);
                }
              }
              if (operatorFirstMessageCreatedAt) {
                return renderDate(operatorFirstMessageCreatedAt);
              }
              if (visitorFirstMessageCreatedAt) {
                return renderDate(visitorFirstMessageCreatedAt);
              }
              return '-';
            },
          },
          {
            key: 'lastMessageCreatedAt',
            title: '最后一条消息时间',
            render: ({ stats }) => {
              if (stats.operatorLastMessageCreatedAt && stats.visitorLastMessageCreatedAt) {
                const d1 = dayjs(stats.operatorLastMessageCreatedAt);
                const d2 = dayjs(stats.visitorLastMessageCreatedAt);
                return d1.isAfter(d2) ? renderDate(d1) : renderDate(d2);
              }
              if (stats.operatorLastMessageCreatedAt) {
                return renderDate(stats.operatorLastMessageCreatedAt);
              }
              if (stats.visitorLastMessageCreatedAt) {
                return renderDate(stats.visitorLastMessageCreatedAt);
              }
              return '-';
            },
          },
          {
            dataIndex: ['stats', 'firstOperatorJoinedAt'],
            title: '成功接入客服时间',
            render: renderDate,
          },
          {
            dataIndex: ['stats', 'operatorFirstMessageCreatedAt'],
            title: '客服首次回复时间',
            render: renderDate,
          },
        ]}
      />
    </div>
  );
}
