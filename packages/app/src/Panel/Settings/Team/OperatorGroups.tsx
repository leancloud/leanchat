import { forwardRef, useRef, useState } from 'react';
import { useToggle } from 'react-use';
import { FaUserFriends } from 'react-icons/fa';
import { Button, Form, FormInstance, Input, Modal, Table, Transfer } from 'antd';

import { OperatorGroup } from '@/Panel/types';
import { useOperators } from '@/Panel/hooks/operator';
import {
  useCreateOperatorGroup,
  useDeleteOperatorGroup,
  useOperatorGroups,
  useUpdateOperatorGroup,
} from '@/Panel/hooks/operator-group';
import { Container } from '../components/Container';

interface OperatorGroupFormData {
  name: string;
  operatorIds?: string[];
}

interface OperatorGroupFormProps {
  initData?: Partial<OperatorGroupFormData>;
  onSubmit: (data: OperatorGroupFormData) => void;
}

const OperatorGroupForm = forwardRef<FormInstance, OperatorGroupFormProps>(
  ({ initData, onSubmit }, ref) => {
    const { data: operators } = useOperators();

    return (
      <Form ref={ref} layout="vertical" onFinish={onSubmit} initialValues={initData}>
        <Form.Item name="name" label="名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="operatorIds" label="成员" valuePropName="targetKeys">
          <Transfer
            dataSource={operators}
            rowKey={(o) => o.id}
            render={(o) => `${o.externalName}(${o.internalName})`}
          />
        </Form.Item>
      </Form>
    );
  },
);

export function OperatorGroups() {
  const [createModalOpen, toggleCreateModal] = useToggle(false);
  const [editingGroup, setEditingGroup] = useState<{
    id: string;
    data: OperatorGroupFormData;
  }>();

  const { mutateAsync: create, isLoading: isCreating } = useCreateOperatorGroup();
  const { mutateAsync: update, isLoading: isUpdating } = useUpdateOperatorGroup();
  const { mutateAsync: remove } = useDeleteOperatorGroup();

  const createFormRef = useRef<FormInstance>(null);
  const updateFormRef = useRef<FormInstance>(null);

  const { data: groups } = useOperatorGroups();

  const handleEdit = (group: OperatorGroup) => {
    setEditingGroup({
      id: group.id,
      data: {
        name: group.name,
        operatorIds: group.operatorIds,
      },
    });
  };

  const handleDelete = (group: OperatorGroup) => {
    Modal.confirm({
      title: '删除客服组',
      content: `客服组 ${group.name} 将被永久删除`,
      okButtonProps: { danger: true },
      onOk: () => remove(group.id),
    });
  };

  return (
    <Container
      header={{
        title: '客服组',
        Icon: FaUserFriends,
        extra: (
          <Button type="primary" onClick={toggleCreateModal}>
            添加客服组
          </Button>
        ),
      }}
    >
      <Modal
        title="添加客服组"
        open={createModalOpen}
        okText="保存"
        onOk={() => createFormRef.current?.submit()}
        onCancel={toggleCreateModal}
        confirmLoading={isCreating}
        bodyStyle={{ paddingTop: 10 }}
        destroyOnClose
      >
        <OperatorGroupForm
          ref={createFormRef}
          onSubmit={(data) => create(data).then(() => toggleCreateModal(false))}
        />
      </Modal>

      <Modal
        title="编辑客服组"
        open={editingGroup !== undefined}
        okText="保存"
        onOk={() => updateFormRef.current?.submit()}
        onCancel={() => setEditingGroup(undefined)}
        confirmLoading={isUpdating}
        bodyStyle={{ paddingTop: 10 }}
        destroyOnClose
      >
        <OperatorGroupForm
          ref={updateFormRef}
          initData={editingGroup?.data}
          onSubmit={(data) => {
            if (editingGroup) {
              update({ ...data, id: editingGroup.id }).then(() => setEditingGroup(undefined));
            }
          }}
        />
      </Modal>

      <Table
        dataSource={groups}
        rowKey={(g) => g.id}
        columns={[
          {
            dataIndex: 'name',
            title: '名称',
          },
          {
            key: 'actions',
            title: '操作',
            render: (group: OperatorGroup) => (
              <div className="space-x-2">
                <button className="text-primary" onClick={() => handleEdit(group)}>
                  编辑
                </button>
                <button className="text-red-500" onClick={() => handleDelete(group)}>
                  删除
                </button>
              </div>
            ),
          },
        ]}
        pagination={false}
      />
    </Container>
  );
}
