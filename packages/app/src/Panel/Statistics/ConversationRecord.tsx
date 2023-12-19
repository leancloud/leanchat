import { ReactNode, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Controller, FormProvider, useController, useForm } from 'react-hook-form';
import { Button, Checkbox, DatePicker, Form, Input, InputNumber, Select, Table } from 'antd';
import { ColumnType } from 'antd/es/table';
import dayjs from 'dayjs';
import _ from 'lodash';
import { get } from 'lodash/fp';
import { useToggle } from 'react-use';

import * as render from './render';
import { ChannelSelect } from './components/ChannelSelect';
import { OperatorSelect } from '../components/OperatorSelect';
import { CategoryCascader } from '../components/CategoryCascader';
import { ConsultationResult, UserType } from '../types';
import { SearchConversationOptions, searchConversation } from '../api/conversation';
import { flow } from './helpers';
import { ExportDataColumn, ExportDataDialog } from './components/ExportDataDialog';
import { useGetOperatorName } from './hooks/useGetOperatorName';
import { useGetCategoryName } from './hooks/useGetCategoryName';

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

interface NumberFieldProps {
  name: string;
  label: ReactNode;
  suffix?: ReactNode;
}

function NumberField({ name, label, suffix }: NumberFieldProps) {
  const typeController = useController({ name: `${name}.type`, defaultValue: 'gt' });
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
              { label: '大于', value: 'gt' },
              { label: '小于', value: 'lt' },
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

function encodeNumberFieldValue(value?: Partial<NumberFieldValue>) {
  if (value && value.type && typeof value.value === 'number') {
    return { [value.type]: value.value };
  }
}

interface FilterFormData {
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];
  channel?: number;
  operatorId?: string;
  extra?: boolean;
  message?: {
    from: number;
    text: string;
  };
  duration?: {
    type: 'gt' | 'lt';
    value?: number;
  };
  averageResponseTime?: {
    type: 'gt' | 'lt';
    value?: number;
  };
  evaluation?: {
    star?: number;
  };
  queued?: boolean;
  closedBy?: number;
  consultationResult?: number;
  categoryId?: string;
}

interface FilterFormProps {
  initData?: FilterFormData;
  onChange: (data: FilterFormData) => void;
  onExport: () => void;
}

function FilterForm({ initData, onChange, onExport }: FilterFormProps) {
  const form = useForm({ defaultValues: initData });
  const extra = form.watch('extra');

  return (
    <FormProvider {...form}>
      <Form onFinish={form.handleSubmit(onChange)} onReset={() => form.reset()}>
        <div className="flex flex-wrap items-center gap-2">
          <Controller
            name="dateRange"
            rules={{ required: true }}
            render={({ field, fieldState: { error } }) => (
              <DatePicker.RangePicker {...field} allowClear={false} status={error && 'error'} />
            )}
          />

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
              <Controller
                name="message.text"
                render={({ field }) => (
                  <Input
                    {...field}
                    allowClear
                    addonBefore={
                      <Controller
                        name="message.from"
                        defaultValue={UserType.Operator}
                        render={({ field }) => (
                          <Select
                            {...field}
                            options={[
                              { label: '客服会话内容', value: UserType.Operator },
                              { label: '用户会话内容', value: UserType.Visitor },
                            ]}
                            style={{ width: 140, textAlign: 'left' }}
                          />
                        )}
                      />
                    }
                    style={{ width: 300 }}
                  />
                )}
              />
              <NumberField name="duration" label="会话持续时长" suffix="秒" />
              <NumberField name="averageResponseTime" label="会话平均响应时长" suffix="秒" />
            </FilterGroup>

            <FilterGroup label="评价筛选">
              <Controller
                name="evaluation.star"
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
              <Controller
                name="consultationResult"
                render={({ field }) => (
                  <Select
                    {...field}
                    allowClear
                    placeholder="咨询结果"
                    options={[
                      { label: '有效咨询', value: ConsultationResult.Valid },
                      { label: '无效咨询', value: ConsultationResult.Invalid },
                      { label: '客服无应答', value: ConsultationResult.OperatorNoResponse },
                    ]}
                    style={{ width: 150 }}
                  />
                )}
              />
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

        <div className="mt-3 flex gap-2">
          <Button type="primary" htmlType="submit">
            查询
          </Button>
          <Button htmlType="reset">重置</Button>
          <Button className="ml-auto" onClick={onExport}>
            导出
          </Button>
        </div>
      </Form>
    </FormProvider>
  );
}

export function ConversationRecord() {
  const [formData, setFormData] = useState<FilterFormData>({
    dateRange: [dayjs(), dayjs()],
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const options = useMemo<SearchConversationOptions>(() => {
    return {
      from: formData.dateRange[0].startOf('day').toISOString(),
      to: formData.dateRange[1].endOf('day').toISOString(),
      channel: formData.channel,
      operatorId: formData.operatorId ? [formData.operatorId] : undefined,
      ...(formData.extra
        ? {
            message: formData.message,
            duration: encodeNumberFieldValue(formData.duration),
            averageResponseTime: encodeNumberFieldValue(formData.averageResponseTime),
            evaluation: formData.evaluation,
            queued: formData.queued,
            closedBy: formData.closedBy,
            consultationResult: formData.consultationResult,
            categoryId: formData.categoryId ? [formData.categoryId] : undefined,
          }
        : {}),
      page,
      pageSize,
    };
  }, [formData, page, pageSize]);

  const { data, isFetching } = useQuery({
    queryKey: ['ConversationRecord', options],
    queryFn: () => searchConversation(options),
  });

  const { getCategoryName } = useGetCategoryName();
  const { getOperatorName } = useGetOperatorName();

  const columns: (ColumnType<any> & ExportDataColumn)[] = [
    {
      key: 'id',
      title: '会话ID',
      render: render.id,
    },
    {
      key: 'createdAt',
      title: '会话开始时间',
      render: render.createdAt,
    },
    {
      key: 'closedAt',
      title: '会话结束时间',
      render: render.closedAt,
    },
    {
      key: 'visitorId',
      title: '用户ID',
      render: render.visitorId,
    },
    {
      key: 'visitorName',
      title: '用户名称',
      render: get('visitor.name'),
    },
    {
      key: 'categoryId',
      title: '分类',
      render: flow([get('categoryId'), getCategoryName]),
    },
    {
      key: 'evaluationStar',
      title: '满意度',
      render: render.evaluationStar,
    },
    {
      key: 'messageCount',
      title: '总会话消息数',
      render: render.messageCount,
    },
    {
      key: 'operatorId',
      title: '客服ID',
      render: render.operatorId,
    },
    {
      key: 'operatorName',
      title: '客服名称',
      render: render.operatorName(getOperatorName),
    },
    {
      key: 'consultationResult',
      title: '咨询结果',
      render: render.consultationResult,
    },
    {
      key: 'evaluationInvited',
      title: '是否邀请评价',
      render: render.evaluationInvited,
    },
    {
      key: 'receptionTime',
      title: '会话总时长(秒)',
      render: render.receptionTime,
    },
    {
      key: 'firstResponseTime',
      title: '首次响应时长(秒)',
      render: render.firstResponseTime,
    },
    {
      key: 'firstMessageFromType',
      title: '第一次发言者',
      render: render.firstMessageFromType,
    },
    {
      key: 'lastMessageCreator',
      title: '最后发言者',
      render: render.lastMessageFromType,
    },
    {
      key: 'visitorLastMessageCreatedAt',
      title: '用户最后消息时间',
      render: render.visitorLastMessageCreatedAt,
    },
    {
      key: 'operatorLastMessageCreatedAt',
      title: '客服最后消息时间',
      render: render.operatorLastMessageCreatedAt,
    },
    {
      key: 'firstMessageCreatedAt',
      title: '第一条消息时间',
      render: render.firstMessageCreatedAt,
    },
    {
      key: 'lastMessageCreatedAt',
      title: '最后一条消息时间',
      render: render.lastMessageCreatedAt,
    },
    {
      key: 'firstOperatorJoinedAt',
      title: '成功接入客服时间',
      render: render.firstOperatorJoinedAt,
    },
    {
      key: 'operatorFirstMessageCreatedAt',
      title: '客服首次回复时间',
      render: render.operatorFirstMessageCreatedAt,
    },
  ];

  const [exportDialogOpen, toggleExportDialog] = useToggle(false);

  return (
    <div>
      <FilterForm
        initData={formData}
        onChange={(data) => {
          setFormData(data);
          setPage(1);
        }}
        onExport={toggleExportDialog}
      />

      <Table
        className="mt-5"
        dataSource={data?.data}
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
        columns={columns}
      />

      <ExportDataDialog
        open={exportDialogOpen}
        onClose={toggleExportDialog}
        searchOptions={options}
        columns={columns}
      />
    </div>
  );
}
