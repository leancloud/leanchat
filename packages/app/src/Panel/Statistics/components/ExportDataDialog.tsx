import { useMemo, useState } from 'react';
import { Checkbox, Modal } from 'antd';
import { CheckboxValueType } from 'antd/es/checkbox/Group';
import dayjs from 'dayjs';
import _ from 'lodash';
import writeXlsxFile from 'write-excel-file';

import { SearchConversationOptions, searchConversation } from '@/Panel/api/conversation';
import { useExportData } from '@/Panel/hooks/useExportData';
import { percent } from '@/Panel/Statistics/helpers';

export interface ExportDataColumn {
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

export function ExportDataDialog({ open, onClose, searchOptions, columns }: ExportDataDialogProps) {
  const [checkedCols, setCheckedCols] = useState<CheckboxValueType[]>(
    columns.map((col) => col.key),
  );
  const includeMessages = useMemo(() => checkedCols.includes('detail'), [checkedCols]);

  const [progress, setProgress] = useState(0);

  const { exportData, isLoading, cancel } = useExportData({
    fetchData: (cursor) => {
      return searchConversation({
        ...searchOptions,
        page: 1,
        pageSize: 1000,
        from: cursor || searchOptions.from,
        count: false,
        messages: includeMessages ? 50 : undefined,
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
      let filename = '互动记录';
      if (searchOptions.from && searchOptions.to) {
        filename += [searchOptions.from, searchOptions.to]
          .map((date) => dayjs(date).format('YYYYMMDD'))
          .join('-');
      }

      const cols = columns.filter((col) => checkedCols.includes(col.key));
      const rows = data.flatMap((t) => t.data).map((data) => cols.map((col) => col.render(data)));

      writeXlsxFile(
        [
          cols.map((col) => ({ value: col.title })),
          ...rows.map((row) => row.map((cell) => ({ value: cell }))),
        ],
        {
          fileName: filename + '.xlsx',
        },
      );
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
