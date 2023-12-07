import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { HiTag } from 'react-icons/hi2';
import { BiSolidPencil } from 'react-icons/bi';
import { Button, Form, Input, Modal, Popover, Table } from 'antd';
import { useToggle } from 'react-use';
import _ from 'lodash';

import { Category } from '@/Panel/types';
import { useCategories, useCategoryTree } from '@/Panel/hooks/category';
import { createCategory, updateCategory } from '@/Panel/api/category';
import { Container } from '../components/Container';
import { ImportXiaoneng } from './ImportXiaoneng';

interface CategoryFormProps {
  initData?: Record<string, any>;
  onSave: (data: any) => void;
}

function CategoryForm({ initData, onSave }: CategoryFormProps) {
  return (
    <Form initialValues={initData} onFinish={onSave}>
      <Form.Item name="name" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
        <Input placeholder="分类名称" />
      </Form.Item>
      <div className="flex flex-row-reverse">
        <Button size="small" type="primary" htmlType="submit">
          保存
        </Button>
      </div>
    </Form>
  );
}

export function Categories() {
  const { data: categories, isLoading, refetch } = useCategories();

  const tree = useCategoryTree(categories);

  const [showCreateForm, setShowCreateForm] = useState<string>();

  const { mutate: create } = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      setShowCreateForm(undefined);
      refetch();
    },
  });

  const [showUpdateForm, setShowUpdateForm] = useState<string>();

  const { mutate: update } = useMutation({
    mutationFn: (args: Parameters<typeof updateCategory>) => updateCategory(...args),
    onSuccess: () => {
      setShowUpdateForm(undefined);
      refetch();
    },
  });

  const [importModalOpen, toggleImportModal] = useToggle(false);

  return (
    <Container
      header={{
        Icon: HiTag,
        title: '分类',
        extra: (
          <div className="space-x-2">
            <Button onClick={toggleImportModal}>导入小能分类</Button>
            <Popover
              destroyTooltipOnHide
              trigger={['click']}
              title="创建分类"
              content={<CategoryForm onSave={create} />}
              open={showCreateForm === 'root'}
              onOpenChange={(open) => setShowCreateForm(open ? 'root' : undefined)}
            >
              <Button type="primary">创建分类</Button>
            </Popover>
          </div>
        ),
      }}
    >
      <Modal
        title="导入小能分类"
        open={importModalOpen}
        footer={false}
        onCancel={toggleImportModal}
      >
        <ImportXiaoneng categories={categories} />
      </Modal>

      <Table
        loading={isLoading}
        dataSource={tree}
        rowKey="id"
        pagination={false}
        columns={[
          {
            key: 'name',
            title: '名称',
            render: (category: Category) => (
              <div className="flex items-center">
                <span>{category.name}</span>
                <Popover
                  destroyTooltipOnHide
                  trigger={['click']}
                  title="修改名称"
                  content={
                    <CategoryForm
                      initData={{ name: category.name }}
                      onSave={(data) => update([category.id, data])}
                    />
                  }
                  open={showUpdateForm === category.id}
                  onOpenChange={(open) => setShowUpdateForm(open ? category.id : undefined)}
                >
                  <a className="ml-2">
                    <BiSolidPencil />
                  </a>
                </Popover>
              </div>
            ),
          },
          {
            key: 'actions',
            title: '操作',
            render: (category: Category) => (
              <Popover
                destroyTooltipOnHide
                trigger={['click']}
                title="创建分类"
                content={
                  <CategoryForm onSave={(data) => create({ ...data, parentId: category.id })} />
                }
                open={showCreateForm === category.id}
                onOpenChange={(open) => setShowCreateForm(open ? category.id : undefined)}
              >
                <a>创建子分类</a>
              </Popover>
            ),
          },
        ]}
      />
    </Container>
  );
}
