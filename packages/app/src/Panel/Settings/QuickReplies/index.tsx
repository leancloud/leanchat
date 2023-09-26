import { ComponentProps, useMemo, useRef, useState } from 'react';
import { IoFlashOutline } from 'react-icons/io5';
import { MdOutlineModeEditOutline, MdDeleteOutline } from 'react-icons/md';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToggle } from 'react-use';
import { Button, Form, FormInstance, Input, Modal, Select, Tooltip } from 'antd';
import cx from 'classnames';
import _ from 'lodash';

import { QuickReply } from '@/Panel/types';
import {
  CreateQuickReplyData,
  createQuickReply,
  deleteQuickReply,
  getQuickReplies,
  updateQuickReply,
} from '@/Panel/api/quick-reply';
import { Container } from '../components/Container';

interface TagButtonProps extends ComponentProps<'button'> {
  active?: boolean;
  count?: number;
}

function TagButton({ active, children, count = 0, ...props }: TagButtonProps) {
  return (
    <button
      {...props}
      className={cx(
        'w-full outline-none text-left transition-colors border-transparent border-l-2 p-2 flex items-center',
        {
          'bg-primary-100 border-l-primary-600': active,
          'hover:bg-gray-100': !active,
        },
        props.className,
      )}
    >
      <span className="truncate mr-auto">{children}</span>
      <span className="font-mono text-xs">{count}</span>
    </button>
  );
}

interface QuickReplyModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateQuickReplyData) => void;
  loading?: boolean;
  initData?: Partial<CreateQuickReplyData>;
}

export function QuickReplyModal({
  open,
  onClose,
  onSave,
  loading,
  initData,
}: QuickReplyModalProps) {
  const { data: quickReplies } = useQuery({
    queryKey: ['QuickReplies'],
    queryFn: getQuickReplies,
    staleTime: 1000 * 60 * 5,
  });

  const tagOptions = useMemo(() => {
    if (!quickReplies) {
      return [];
    }
    const tags = quickReplies.flatMap((qr) => qr.tags || []);
    return _.uniq(tags).map((tag) => ({ label: tag, value: tag }));
  }, [quickReplies]);

  const formRef = useRef<FormInstance>(null);

  return (
    <Modal
      destroyOnClose
      title="创建快捷回复"
      open={open}
      onCancel={onClose}
      onOk={() => formRef.current?.submit()}
      confirmLoading={loading}
      okText="保存"
    >
      <Form ref={formRef} initialValues={initData} onFinish={onSave}>
        <Form.Item name="content" rules={[{ required: true }]}>
          <Input.TextArea rows={5} placeholder="回复内容" style={{ resize: 'none' }} />
        </Form.Item>
        <Form.Item name="tags" rules={[{ required: true }]}>
          <Select mode="tags" placeholder="添加标签" options={tagOptions} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export function QuickReplies() {
  const { data: quickReplies, refetch } = useQuery({
    queryKey: ['QuickReplies'],
    queryFn: getQuickReplies,
    staleTime: 1000 * 60 * 5,
  });

  const quickRepliesByTag = useMemo(() => {
    const quickRepliesByTag: Record<string, QuickReply[]> = {};
    quickReplies?.forEach((quickReply) => {
      quickReply.tags?.forEach((tag) => {
        if (!quickRepliesByTag[tag]) {
          quickRepliesByTag[tag] = [];
        }
        quickRepliesByTag[tag].push(quickReply);
      });
    });
    return quickRepliesByTag;
  }, [quickReplies]);

  const [currentTag, setCurrentTag] = useState<string>();

  const tags = Object.keys(quickRepliesByTag);
  const currentReplies = currentTag ? quickRepliesByTag[currentTag] : quickReplies;

  const [createModalOpen, toggleCreateModal] = useToggle(false);
  const [editingReply, setEditingReply] = useState<QuickReply>();

  const { mutate: create, isLoading: isCreating } = useMutation({
    mutationFn: createQuickReply,
    onSuccess: () => {
      refetch();
      toggleCreateModal(false);
    },
  });

  const { mutate: update, isLoading: isUpdating } = useMutation({
    mutationFn: (args: Parameters<typeof updateQuickReply>) => {
      return updateQuickReply(...args);
    },
    onSuccess: () => {
      refetch();
      setEditingReply(undefined);
    },
  });

  const { mutate: remove } = useMutation({
    mutationFn: deleteQuickReply,
    onSuccess: () => {
      refetch();
    },
  });

  return (
    <Container
      header={{
        Icon: IoFlashOutline,
        title: '快捷回复',
        extra: (
          <Button type="primary" onClick={toggleCreateModal}>
            创建快捷回复
          </Button>
        ),
      }}
    >
      <div className="grid grid-cols-4 gap-4 text-sm">
        <div className="col-span-1">
          <TagButton
            active={!currentTag}
            count={quickReplies?.length}
            onClick={() => setCurrentTag(undefined)}
          >
            全部
          </TagButton>
          {tags.map((tag) => (
            <TagButton
              key={tag}
              active={tag === currentTag}
              count={quickRepliesByTag[tag]?.length}
              onClick={() => setCurrentTag(tag)}
            >
              <span className="text-[#969696] mr-0.5">#</span>
              {tag}
            </TagButton>
          ))}
        </div>
        <div className="col-span-3 divide-y divide-dashed">
          {currentReplies?.map((quickReply) => (
            <div key={quickReply.id} className="p-4">
              <div>{quickReply.content}</div>
              <div className="flex justify-between items-end mt-2">
                <div className="flex flex-wrap gap-2">
                  {quickReply.tags?.map((tag) => (
                    <button
                      key={tag}
                      className="bg-gray-100 px-2 leading-7 rounded text-[#969696]"
                      onClick={() => setCurrentTag(tag)}
                    >
                      <span className="mr-0.5">#</span>
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="space-x-2 shrink-0">
                  <Tooltip title="编辑" placement="bottom" mouseEnterDelay={0.5}>
                    <button
                      className="p-1 hover:bg-[#f7f7f7] rounded"
                      onClick={() => setEditingReply(quickReply)}
                    >
                      <MdOutlineModeEditOutline className="w-5 h-5" />
                    </button>
                  </Tooltip>
                  <Tooltip title="删除" placement="bottom" mouseEnterDelay={0.5}>
                    <button
                      className="p-1 hover:bg-[#f7f7f7] rounded"
                      onClick={() => remove(quickReply.id)}
                    >
                      <MdDeleteOutline className="w-5 h-5" />
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <QuickReplyModal
        open={createModalOpen}
        onClose={toggleCreateModal}
        onSave={create}
        loading={isCreating}
      />

      <QuickReplyModal
        open={!!editingReply}
        initData={editingReply}
        onClose={() => setEditingReply(undefined)}
        onSave={(data) => update([editingReply!.id, data])}
        loading={isUpdating}
      />
    </Container>
  );
}
