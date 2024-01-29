import { useRef, useState } from 'react';
import { AiFillRobot } from 'react-icons/ai';
import { useMutation } from '@tanstack/react-query';
import { Button, Modal, Table } from 'antd';

import { Chatbot } from '@/Panel/types';
import { createChatbot, updateChatbot } from '@/Panel/api/chatbot';
import { useChatbots } from '@/Panel/hooks/chatbot';
import { Container } from '../components/Container';
import { ChatbotFormModal, ChatbotFormModalRef } from './ChatbotFormModal';
import { ChatbotFormData } from './ChatbotForm';
import { ChatbotTester } from './ChatbotTester';

export function Chatbots() {
  const { data: chatbots, refetch } = useChatbots();

  const { mutate: create, isLoading: isCreating } = useMutation({
    mutationFn: createChatbot,
    onSuccess: () => {
      refetch();
      createModalRef.current.close();
    },
  });

  const { mutate: update, isLoading: isUpdating } = useMutation({
    mutationFn: updateChatbot,
    onSuccess: () => {
      refetch();
      updateModalRef.current.close();
    },
  });

  const createModalRef = useRef<ChatbotFormModalRef>(null!);
  const updateModalRef = useRef<ChatbotFormModalRef>(null!);

  const handleCreate = () => {
    createModalRef.current.open();
  };

  const [editingId, setEditingId] = useState<string>();
  const handleEdit = (chatbot: Chatbot) => {
    setEditingId(chatbot.id);
    updateModalRef.current.open({
      initData: {
        name: chatbot.name,
        acceptRule: chatbot.acceptRule,
        workingTime: chatbot.workingTime,
        globalQuestionBaseIds: chatbot.globalQuestionBaseIds,
        initialQuestionBaseIds: chatbot.initialQuestionBaseIds,
        greetingMessage: chatbot.greetingMessage,
        noMatchMessage: chatbot.noMatchMessage,
      },
    });
  };

  const handleUpdate = (data: ChatbotFormData) => {
    if (editingId) {
      update({
        ...data,
        id: editingId,
        acceptRule: data.acceptRule ?? null,
        workingTime: data.workingTime ?? null,
      });
    }
  };

  const [testingChatbot, setTestingChatbot] = useState<Chatbot>();

  return (
    <Container
      header={{
        Icon: AiFillRobot,
        title: '聊天机器人',
        extra: (
          <Button type="primary" onClick={handleCreate}>
            创建机器人
          </Button>
        ),
      }}
    >
      <ChatbotFormModal
        ref={createModalRef}
        title="创建聊天机器人"
        onSubmit={create}
        loading={isCreating}
      />
      <ChatbotFormModal
        ref={updateModalRef}
        title="编辑聊天机器人"
        onSubmit={handleUpdate}
        loading={isUpdating}
      />

      <Table
        dataSource={chatbots}
        rowKey={(bot) => bot.id}
        columns={[
          {
            dataIndex: 'name',
            title: '名称',
          },
          {
            dataIndex: 'acceptRule',
            title: '接待规则',
            render: (value: number) => [, '全部会话', '排队会话'][value],
          },
          {
            key: 'actions',
            title: '操作',
            render: (chatbot: Chatbot) => (
              <div className="space-x-1">
                <a onClick={() => handleEdit(chatbot)}>编辑</a>
                <a onClick={() => setTestingChatbot(chatbot)}>测试</a>
              </div>
            ),
          },
        ]}
      />

      <Modal
        destroyOnClose
        title={testingChatbot?.name}
        open={!!testingChatbot}
        onCancel={() => setTestingChatbot(undefined)}
        footer={null}
      >
        {testingChatbot && <ChatbotTester chatbot={testingChatbot} />}
      </Modal>
    </Container>
  );
}
