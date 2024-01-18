import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AiFillBook } from 'react-icons/ai';
import { useToggle } from 'react-use';
import { Link, useParams } from 'react-router-dom';
import { Button, Divider, Modal, Table } from 'antd';
import dayjs from 'dayjs';

import {
  createQuestion,
  createQuestionBase,
  reorderQuestions,
  updateQuestion,
} from '@/Panel/api/chatbot';
import {
  useChatbotQuestionBase,
  useChatbotQuestionBases,
  useChatbotQuestions,
  useDeleteQuestion,
  useUpdateQuestionBase,
} from '@/Panel/hooks/chatbot';
import { ChatbotQuestion, ChatbotQuestionBase } from '@/Panel/types';
import { Container } from '../components/Container';
import { QuestionFormModal } from './QuestionFormModal';
import { QuestionFormData } from './QuestionForm';
import { QuestionBaseFormModal } from './QuestionBaseFormModal';
import { QuestionBaseForm } from './QuestionBaseForm';
import { ReorderModal } from './ReorderModal';

export function QuestionBases() {
  const [createModalOpen, toggleCreateModal] = useToggle(false);

  const { data: questionBases, refetch } = useChatbotQuestionBases();

  const { mutate: create, isLoading: isCreating } = useMutation({
    mutationFn: createQuestionBase,
    onSuccess: () => {
      refetch();
      toggleCreateModal(false);
    },
  });

  return (
    <Container
      header={{
        Icon: AiFillBook,
        title: '问题库',
        extra: (
          <Button type="primary" onClick={toggleCreateModal}>
            创建
          </Button>
        ),
      }}
    >
      <QuestionBaseFormModal
        open={createModalOpen}
        onCancel={toggleCreateModal}
        onSubmit={create}
        loading={isCreating}
      />

      <Table
        dataSource={questionBases}
        rowKey={(qb) => qb.id}
        columns={[
          {
            dataIndex: 'name',
            title: '名称',
          },
          {
            dataIndex: 'createdAt',
            title: '创建时间',
            render: (dateString: string) => dayjs(dateString).format('YYYY-MM-DD HH:mm:ss'),
          },
          {
            key: 'actions',
            title: '操作',
            render: (base: ChatbotQuestionBase) => <Link to={base.id}>编辑</Link>,
          },
        ]}
      />
    </Container>
  );
}

export function QuestionBase() {
  const { id } = useParams();
  const [questionModalOpen, toggleQuestionModal] = useToggle(false);
  const [reorderModalOpen, toggleReorderModal] = useToggle(false);

  const { data: questionBase } = useChatbotQuestionBase(id!);

  const { data: questions, refetch } = useChatbotQuestions(id!);

  const { mutate: updateBase } = useUpdateQuestionBase();

  const { mutate: create, isLoading: isCreating } = useMutation({
    mutationFn: createQuestion,
    onSuccess: () => {
      refetch();
      toggleQuestionModal(false);
    },
  });

  const { mutate: update, isLoading: isUpdating } = useMutation({
    mutationFn: updateQuestion,
    onSuccess: () => {
      refetch();
      setEditingQuestion(undefined);
    },
  });

  const { mutateAsync: deleteQuestion } = useDeleteQuestion();

  const { mutate: reorder } = useMutation({
    mutationFn: reorderQuestions,
    onSuccess: () => {
      refetch();
      toggleReorderModal(false);
    },
  });

  const [editingQuestion, setEditingQuestion] = useState<{
    id: string;
    data: Partial<QuestionFormData>;
  }>();

  const editQuestion = (q: ChatbotQuestion) => {
    setEditingQuestion({
      id: q.id,
      data: {
        matcher: q.matcher,
        question: q.question,
        similarQuestions: q.similarQuestions,
        answer: q.answer,
        nextQuestionBaseId: q.nextQuestionBaseId,
        assignOperator: q.assignOperator,
      },
    });
  };

  const handleSubmit = (data: QuestionFormData) => {
    if (editingQuestion) {
      update({
        ...data,
        nextQuestionBaseId: data.nextQuestionBaseId || null,
        questionBaseId: id!,
        questionId: editingQuestion.id,
      });
    } else {
      create({ ...data, questionBaseId: id! });
    }
  };

  const handleDelete = (questionId: string) => {
    Modal.confirm({
      title: '删除问题',
      content: '该操作不可恢复',
      onOk: () => deleteQuestion({ questionBaseId: id!, questionId }),
      okButtonProps: { danger: true },
    });
  };

  return (
    <Container
      header={{
        Icon: AiFillBook,
        title: questionBase ? questionBase.name : 'Loading',
      }}
    >
      <QuestionFormModal
        open={questionModalOpen || !!editingQuestion}
        title={editingQuestion ? '编辑问题' : '创建问题'}
        onCancel={() => {
          toggleQuestionModal(false);
          setEditingQuestion(undefined);
        }}
        initData={editingQuestion?.data}
        onSubmit={handleSubmit}
        loading={isCreating || isUpdating}
      />

      {questionBase && (
        <QuestionBaseForm
          initData={{ name: questionBase.name }}
          onSubmit={(data) => updateBase({ ...data, id: questionBase.id })}
        />
      )}

      <Divider>问题列表</Divider>

      <div className="flex flex-row-reverse gap-2 items-center mb-4">
        <Button type="primary" onClick={toggleQuestionModal}>
          创建新问题
        </Button>
        <Button onClick={toggleReorderModal}>调整顺序</Button>
      </div>

      <ReorderModal
        open={reorderModalOpen}
        onCancel={toggleReorderModal}
        questions={questions}
        onSave={reorder}
      />

      <Table
        dataSource={questions}
        rowKey={(q) => q.id}
        columns={[
          {
            dataIndex: 'question',
            title: '标准问法',
            render: (q?: string) => q || <span className="italic text-gray-400">匹配所有</span>,
          },
          {
            dataIndex: 'matcher',
            title: '匹配方式',
            render: (matcher: number) => [, '完全匹配', '部分匹配'][matcher],
          },
          {
            key: 'actions',
            title: '操作',
            render: (question: ChatbotQuestion) => (
              <div className="space-x-2">
                <a onClick={() => editQuestion(question)}>编辑</a>
                <a className="!text-red-500" onClick={() => handleDelete(question.id)}>
                  删除
                </a>
              </div>
            ),
          },
        ]}
      />
    </Container>
  );
}
