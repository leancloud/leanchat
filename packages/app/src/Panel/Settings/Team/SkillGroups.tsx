import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MdGroup, MdPersonAddAlt1 } from 'react-icons/md';
import { Button, Form, Input, Table, Transfer, message } from 'antd';

import { createSkillGroup, updateSkillGroup } from '@/Panel/api/skill-group';
import { useOperators } from '@/Panel/hooks/operator';
import { useSkillGroup, useSkillGroups } from '@/Panel/hooks/skill-group';
import { Container } from '../components/Container';

export function SkillGroups() {
  const { data, isLoading } = useSkillGroups();

  return (
    <Container
      header={{
        Icon: MdGroup,
        title: '客服',
        extra: (
          <Link to="new">
            <Button type="primary">添加技能组</Button>
          </Link>
        ),
      }}
    >
      <Table
        loading={isLoading}
        dataSource={data}
        rowKey="id"
        pagination={false}
        columns={[
          {
            dataIndex: 'name',
            title: '名称',
          },
          {
            dataIndex: 'memberIds',
            title: '成员数',
            render: (arr: string[]) => arr.length,
          },
          {
            key: 'actions',
            width: 200,
            render: (group) => <Link to={group.id}>编辑</Link>,
          },
        ]}
      />
    </Container>
  );
}

interface SkillGroupFormData {
  name: string;
  memberIds?: string[];
}

interface SkillGroupFormProps {
  initData?: Partial<SkillGroupFormData>;
  onSubmit: (data: SkillGroupFormData) => void;
  submitting?: boolean;
  submitButtonText?: string;
}

function SkillGroupForm({
  initData,
  onSubmit,
  submitting,
  submitButtonText = '提交',
}: SkillGroupFormProps) {
  const { data: operators } = useOperators();

  const [memberIds, setMemberIds] = useState(initData?.memberIds);

  return (
    <Form
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 20 }}
      style={{ maxWidth: 600 }}
      initialValues={initData}
      onFinish={onSubmit}
    >
      <Form.Item label="名称" name="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item label="成员" name="memberIds">
        <Transfer
          showSearch
          dataSource={operators}
          rowKey={(o) => o.id}
          render={(o) => o.internalName}
          targetKeys={memberIds}
          onChange={setMemberIds}
          filterOption={(inputValue, operator) => {
            return operator.internalName.includes(inputValue);
          }}
        />
      </Form.Item>

      <Form.Item wrapperCol={{ offset: 4, span: 20 }}>
        <Button type="primary" htmlType="submit" loading={submitting}>
          {submitButtonText}
        </Button>
      </Form.Item>
    </Form>
  );
}

export function NewSkillGroup() {
  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const { mutate, isLoading } = useMutation({
    mutationFn: createSkillGroup,
    onSuccess: () => {
      queryClient.invalidateQueries(['SkillGroups']);
      message.success('已添加');
      navigate('..');
    },
  });

  return (
    <Container
      header={{
        Icon: MdPersonAddAlt1,
        title: '添加技能组',
      }}
    >
      <SkillGroupForm onSubmit={mutate} submitting={isLoading} submitButtonText="添加" />
    </Container>
  );
}

export function EditSkillGroup() {
  const { id } = useParams();

  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const { data } = useSkillGroup(id!);

  const { mutate, isLoading } = useMutation({
    mutationFn: (args: Parameters<typeof updateSkillGroup>) => updateSkillGroup(...args),
    onSuccess: () => {
      queryClient.invalidateQueries(['SkillGroups']);
      queryClient.invalidateQueries(['SkillGroup', id]);
      message.success('已保存');
      navigate('..');
    },
  });

  return (
    <Container
      header={{
        Icon: MdPersonAddAlt1,
        title: '编辑技能组',
      }}
    >
      {data && (
        <SkillGroupForm
          initData={data}
          onSubmit={(data) => mutate([id!, data])}
          submitting={isLoading}
          submitButtonText="保存"
        />
      )}
    </Container>
  );
}
