import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToggle } from 'react-use';
import { Button, Checkbox, Modal, Table } from 'antd';
import { ColumnType } from 'antd/es/table';
import { CheckboxValueType } from 'antd/es/checkbox/Group';
import dayjs from 'dayjs';
import _ from 'lodash';
import { eq, find, get, has } from 'lodash/fp';
import Papa from 'papaparse';

import {
  ConversationData,
  SearchConversationOptions,
  searchConversation,
} from '@/Panel/api/conversation';
import { useExportData as useExportData2 } from '@/Panel/hooks/useExportData';
import { SearchForm, SearchFormData } from './components/SearchForm';
import { useCategories } from '../hooks/category';
import { Category, Operator, UserType } from '../types';
import { useOperators } from '../hooks/operator';
import { downloadCSV, flow, formatDate, percent, renderTime } from './helpers';
import { ConversationInfo } from './components/ConversationInfo';

function useGetCategoryName(categories?: Category[]) {
  const categoryMap = useMemo(() => _.keyBy(categories, (c) => c.id), [categories]);
  const getCategoryPath = useCallback(
    (id: string): Category[] => {
      const category = categoryMap[id];
      if (category) {
        return category.parentId ? [...getCategoryPath(category.parentId), category] : [category];
      }
      return [];
    },
    [categoryMap],
  );
  return useCallback(
    (id: string) => {
      return getCategoryPath(id)
        .map((c) => c.name)
        .join('/');
    },
    [getCategoryPath],
  );
}

function useGetOperatorName(operators?: Operator[]) {
  const operatorMap = useMemo(() => _.keyBy(operators, (o) => o.id), [operators]);
  return useCallback(
    (id: string) => {
      return operatorMap[id]?.internalName;
    },
    [operatorMap],
  );
}

const getFirstMessageUserType = (data: ConversationData) => {
  if (data.stats) {
    const { visitorFirstMessageCreatedAt: v, operatorFirstMessageCreatedAt: o } = data.stats;
    if (v && o) {
      return dayjs(v).isBefore(o) ? '用户' : '客服';
    }
    if (v) {
      return '用户';
    }
    if (o) {
      return '客服';
    }
  }
};

const getLastMessageUserType = (data: ConversationData) => {
  if (data.stats) {
    const { visitorFirstMessageCreatedAt: v, operatorFirstMessageCreatedAt: o } = data.stats;
    if (v && o) {
      return dayjs(v).isAfter(o) ? '用户' : '客服';
    }
    if (v) {
      return '用户';
    }
    if (o) {
      return '客服';
    }
  }
};

function getFirstMessageCreatedAt(data: ConversationData) {
  if (data.stats) {
    const { operatorFirstMessageCreatedAt: o, visitorFirstMessageCreatedAt: v } = data.stats;
    if (o && v) {
      return dayjs(o).isBefore(v) ? o : v;
    }
    return o || v;
  }
}

function getLastMessageCreatedAt(data: ConversationData) {
  if (data.stats) {
    const { operatorLastMessageCreatedAt: o, visitorLastMessageCreatedAt: v } = data.stats;
    if (o && v) {
      return dayjs(o).isAfter(v) ? o : v;
    }
    return o || v;
  }
}

function getChatDuration(data: ConversationData) {
  const first = getFirstMessageCreatedAt(data);
  const last = getLastMessageCreatedAt(data);
  if (first && last) {
    return dayjs(last).diff(first, 'ms');
  }
}

interface ExportDataColumn {
  key: string;
  title: string;
  render: (value: any) => any;
}

interface ExportDataDialogProps {
  open?: boolean;
  onClose: () => void;
  searchOptions: SearchConversationOptions;
  columns: ExportDataColumn[];
}

function ExportDataDialog({ open, onClose, searchOptions, columns }: ExportDataDialogProps) {
  const [checkedCols, setCheckedCols] = useState<CheckboxValueType[]>(
    columns.map((col) => col.key),
  );

  const [progress, setProgress] = useState(0);

  const { exportData, isLoading, cancel } = useExportData2({
    fetchData: (cursor) => {
      return searchConversation({
        ...searchOptions,
        page: 1,
        pageSize: 1000,
        from: cursor || searchOptions.from,
      });
    },
    getNextCursor: (lastData) => {
      if (lastData.data.length < 1000) {
        return;
      }
      const conv = _.last(lastData.data);
      if (conv) {
        return dayjs(conv.createdAt).add(1, 'ms').toISOString();
      }
    },
    delay: 0,
    onProgress: ({ totalCount }, data) => {
      const loaded = _.sum(data.map((t) => t.data.length));
      setProgress(percent(loaded, loaded + totalCount));
    },
    onSuccess: (data) => {
      const cols = columns.filter((col) => checkedCols.includes(col.key));
      const rows = data.flatMap((t) => t.data).map((data) => cols.map((col) => col.render(data)));
      const content = Papa.unparse({
        fields: cols.map((col) => col.title),
        data: rows,
      });
      downloadCSV(content, '导出数据.csv');
    },
  });

  const handleCheckAll = () => {
    if (checkedCols.length === columns.length) {
      setCheckedCols([]);
    } else {
      setCheckedCols(columns.map((col) => col.key));
    }
  };

  const handleExport = () => {
    setProgress(0);
    exportData();
  };

  const handleClose = () => {
    cancel();
    onClose();
  };

  return (
    <Modal
      title="导出数据"
      open={open}
      onCancel={handleClose}
      maskClosable={false}
      okText={isLoading ? `${progress}%` : '导出'}
      okButtonProps={{ disabled: checkedCols.length === 0 }}
      onOk={handleExport}
      confirmLoading={isLoading}
    >
      <div className="mt-4 mb-2">
        <div className="mb-2 font-medium">
          <span className="mr-2">选择字段</span>
          <Checkbox
            checked={checkedCols.length === columns.length}
            indeterminate={checkedCols.length > 0 && checkedCols.length < columns.length}
            onChange={handleCheckAll}
          >
            全选
          </Checkbox>
        </div>
        <Checkbox.Group disabled={false} value={checkedCols} onChange={setCheckedCols}>
          <div className="grid grid-cols-3 gap-x-2 gap-y-1">
            {columns.map((col) => (
              <Checkbox key={col.key} value={col.key}>
                {col.title}
              </Checkbox>
            ))}
          </div>
        </Checkbox.Group>
      </div>
    </Modal>
  );
}

export default function Quality() {
  const [options, setOptions] = useState<SearchConversationOptions>({
    from: dayjs().startOf('day').toISOString(),
    to: dayjs().endOf('day').toISOString(),
    page: 1,
    pageSize: 20,
  });

  const { data } = useQuery({
    enabled: !!options,
    queryKey: ['SearchConversationResult', options],
    queryFn: () => searchConversation(options!),
  });

  const handleSearchFormSubmit = (data: SearchFormData) => {
    const {
      date: [from, to],
      message,
      categoryId,
      visitorId,
      operatorId,
      closedBy,
      evaluation,
    } = data;
    setOptions({
      from: from.startOf('day').toISOString(),
      to: to.endOf('day').toISOString(),
      message,
      categoryId: categoryId ? [categoryId] : undefined,
      visitorId: visitorId ? [visitorId] : undefined,
      operatorId,
      closedBy,
      evaluation,
    });
  };

  const { data: categories } = useCategories();
  const getCategoryName = useGetCategoryName(categories);

  const { data: operators } = useOperators();
  const getOperatorName = useGetOperatorName(operators);

  const [exportModalOpen, toggleExportModal] = useToggle(false);
  const handleExportData = () => {
    if (!data || !categories || !operators) {
      return;
    }
    if (data.totalCount > 10000) {
      alert('导出数据量过大，请缩小检索范围');
      return;
    }
    toggleExportModal();
  };

  const [selectedConvId, setSelectedConvId] = useState<string>();

  const columns: (ColumnType<ConversationData> & ExportDataColumn)[] = [
    {
      key: 'id',
      title: '会话ID',
      render: (data: ConversationData) => data.id,
    },
    {
      key: 'createdAt',
      title: '会话开始时间',
      render: flow([get('createdAt'), formatDate]),
    },
    {
      key: 'closedAt',
      title: '会话结束时间',
      render: flow([get('closedAt'), formatDate]),
    },
    {
      key: 'categoryId',
      title: '咨询类型',
      render: flow([get('categoryId'), getCategoryName]),
    },
    {
      key: 'visitorId',
      title: '用户ID',
      render: get('visitorId'),
    },
    {
      key: 'operatorId',
      title: '负责客服',
      render: flow([get('operatorId'), getOperatorName]),
    },
    {
      key: 'joinedOperatorIds',
      title: '参与客服',
      render: flow([
        get('joinedOperatorIds'),
        (ids: string[]) => ids.map(getOperatorName).join(','),
      ]),
    },
    {
      key: 'messageCount',
      title: '消息条数',
      render: flow([
        _.over([get('stats.operatorMessageCount'), get('stats.visitorMessageCount')]),
        _.sum,
      ]),
    },
    {
      key: 'operatorMessageCount',
      title: '客服消息条数',
      render: get('stats.operatorMessageCount'),
    },
    {
      key: 'visitorMessageCount',
      title: '用户消息条数',
      render: get('stats.visitorMessageCount'),
    },
    {
      key: 'round',
      title: '会话回合数',
      render: get('stats.round'),
    },
    {
      key: 'duration',
      title: '会话持续时长',
      render: flow([get('stats.duration'), renderTime]),
    },
    {
      key: 'closedBy',
      title: '咨询结束人',
      render: flow([
        get('closedBy.type'),
        _.cond([
          [eq(UserType.Visitor), _.constant('用户')],
          [eq(UserType.Operator), _.constant('客服')],
          [eq(UserType.System), _.constant('系统')],
        ]),
      ]),
    },
    {
      key: 'evaluationInvitedAt',
      title: '是否邀请评价',
      render: _.cond([
        [has('evaluationInvitedAt'), _.constant('已邀请')],
        [_.stubTrue, _.constant('未邀请')],
      ]),
    },
    {
      key: 'evaluationStar',
      title: '满意度',
      render: flow([
        get('evaluation.star'),
        (star: number) => [, '非常不满意', '不满意', '一般', '满意', '非常满意'][star],
      ]),
    },
    {
      key: 'evaluationFeedback',
      title: '客户建议',
      render: get('evaluation.feedback'),
    },
    {
      key: 'firstResponseTime',
      title: '首次响应时间',
      render: flow([get('stats.firstResponseTime'), renderTime]),
    },
    {
      key: 'firstMessageFrom',
      title: '第一次发言者类型',
      render: getFirstMessageUserType,
    },
    {
      key: 'firstMessageCreatedAt',
      title: '第一条消息时间',
      render: flow([getFirstMessageCreatedAt, formatDate]),
    },
    {
      key: 'lastMessageFrom',
      title: '最后发言者类型',
      render: getLastMessageUserType,
    },
    {
      key: 'lastMessageCreatedAt',
      title: '最后一条消息时间',
      render: flow([getLastMessageCreatedAt, formatDate]),
    },
    {
      key: 'maxResponseTime',
      title: '最长响应时间',
      render: flow([get('stats.maxResponseTime'), renderTime]),
    },
    {
      key: 'chatDuration',
      title: '会话聊天时长',
      render: flow([getChatDuration, renderTime]),
    },
    {
      key: 'queuedAtOrfirstOperatorJoinedAt',
      title: '第一次转人工时间',
      render: flow([
        _.over([get('queuedAt'), get('stats.firstOperatorJoinedAt')]),
        find(_.isString),
        formatDate,
      ]),
    },
    {
      key: 'firstOperatorJoinedAt',
      title: '成功转人工时间',
      render: flow([get('stats.firstOperatorJoinedAt'), formatDate]),
    },
    {
      key: 'queueConnectionTime',
      title: '排队等待时长',
      render: flow([get('stats.queueConnectionTime'), formatDate]),
    },
  ];

  return (
    <div className="p-5 bg-white h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium mb-5">互动记录</h1>
        <Button onClick={handleExportData} disabled={!data || !data.totalCount}>
          导出
        </Button>
      </div>
      <div className="grid grid-cols-[400px_1fr] gap-4">
        <div>
          <SearchForm
            initData={{
              date: [dayjs(), dayjs()],
            }}
            onSubmit={handleSearchFormSubmit}
          />
        </div>
        <div className="overflow-hidden">
          <Table
            dataSource={data?.data}
            rowKey={(row) => row.id}
            scroll={{ x: 'max-content' }}
            pagination={{
              total: data?.totalCount,
              current: options.page,
              pageSize: options.pageSize,
              showSizeChanger: true,
              onChange: (page, pageSize) => {
                setOptions((prev) => ({ ...prev, page, pageSize }));
              },
            }}
            columns={[
              ...columns,
              {
                key: 'detail',
                title: '操作',
                render: (conv) => <a onClick={() => setSelectedConvId(conv.id)}>详情</a>,
              },
            ]}
          />
        </div>

        <ExportDataDialog
          open={exportModalOpen}
          onClose={toggleExportModal}
          searchOptions={options}
          columns={columns}
        />

        <ConversationInfo
          conversationId={selectedConvId}
          onClose={() => setSelectedConvId(undefined)}
        />
      </div>
    </div>
  );
}
