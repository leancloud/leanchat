import { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AiOutlineClockCircle, AiOutlinePaperClip } from 'react-icons/ai';
import { FiCheck } from 'react-icons/fi';
import { HiDotsHorizontal } from 'react-icons/hi';
import { FaUserEdit } from 'react-icons/fa';
import { useToggle } from 'react-use';
import { Button, Divider, Dropdown, Modal, Progress, Tooltip, message } from 'antd';
import cx from 'classnames';
import _ from 'lodash';

import { useSocket } from '@/socket';
import { useCurrentUser } from '@/Panel/auth';
import { useConversation, useUpdateConversation } from '@/Panel/hooks/conversation';
import { ConversationDetail } from './ConversationDetail';
import { ConversationContext } from './contexts/ConversationContext';
import { MessageList, MessageListRef } from './MessageList';
import { Avatar } from '../components/Avatar';
import { useOperators } from '../hooks/operator';
import { ReassignModal } from './ReassignModal';
import { QuickReply } from './QuickReply';
import { closeConversation, inviteEvaluation, assignconversation } from '../api/conversation';
import { uploadFile } from '../leancloud';
import { ConversationStatus } from '../types';
import { useAutoSize } from '../hooks/useAutoSize';
import { CloseConfirm } from './components/CloseConfirm';
import { useReplyDraft } from './hooks/useReplyDraft';

interface OperatorLabelProps {
  operatorId: string;
  onClick?: () => void;
  disabled?: boolean;
}

function OperatorLabel({ operatorId, onClick, disabled }: OperatorLabelProps) {
  const { data: operators } = useOperators();

  const operator = useMemo(
    () => operators?.find((o) => o.id === operatorId),
    [operators, operatorId],
  );

  if (!operator) {
    return;
  }

  return (
    <button
      className="flex items-center rounded-full pr-2 transition-colors enabled:hover:bg-[#f7f7f7] disabled:cursor-not-allowed"
      onClick={onClick}
      disabled={disabled}
    >
      <Avatar size={32} user={operator} />
      <div className="ml-2 text-sm">{operator.internalName}</div>
    </button>
  );
}

interface ConversationProps {
  conversationId: string;
  reopen?: boolean;
  onReopen?: () => void;
}

export function Conversation({ conversationId, reopen, onReopen }: ConversationProps) {
  const user = useCurrentUser();
  const socket = useSocket();

  const { data: conversation } = useConversation(conversationId);

  const [visitorMessageMode, setVisitorMessageMode] = useState(false);

  const [content, setContent] = useReplyDraft(conversationId);
  const [showQuickReply, setShowQuickReply] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null!);

  const resize = useAutoSize(textareaRef, 3, 15);

  useEffect(() => {
    resize();
  }, [content]);

  useEffect(() => {
    if (
      conversation &&
      conversation.status === ConversationStatus.Open &&
      conversation.operatorId
    ) {
      const textarea = textareaRef.current;
      if (textarea) {
        const length = textarea.value.length;
        // 自动 focus 输入框, 减少客服操作步骤
        textarea.focus();
        // 移动光标到末尾
        textarea.setSelectionRange(length, length);
      }
    }
  }, [conversation]);

  const handleCreateMessage = async () => {
    const trimedContent = content.trim();
    if (!trimedContent) {
      return;
    }
    socket.emit('message', {
      conversationId,
      data: {
        text: trimedContent,
      },
    });
    setContent('');
    textareaRef.current?.focus();
    messageListRef.current?.setScrollBehavior('attachBottom');
  };

  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(50);

  const sendFileMessage = async (file: File) => {
    setUploading(true);
    try {
      const id = await uploadFile(file, {
        onProgress: (e) => setUploadPercent(e.percent || 0),
      });
      socket.emit('message', {
        conversationId,
        data: {
          file: { id },
        },
      });
      messageListRef.current?.setScrollBehavior('attachBottom');
    } finally {
      setUploading(false);
      setUploadPercent(0);
    }
  };

  const { mutate: joinConversation } = useMutation({
    mutationFn: () => {
      return assignconversation(conversationId, user!.id);
    },
  });

  const { mutate: close, isLoading: isClosing } = useMutation({
    mutationFn: () => {
      return closeConversation(conversationId);
    },
  });

  const { mutateAsync: update, isLoading: isUpdating } = useUpdateConversation();

  const handleClose = (categoryId?: string) => {
    if (categoryId) {
      update({ id: conversationId, categoryId }).then(() => {
        toggleCloseModal(false);
        close();
      });
    } else {
      toggleCloseModal(false);
      close();
    }
  };

  const { mutate: _inviteEvaluation } = useMutation({
    mutationFn: () => {
      return inviteEvaluation(conversationId);
    },
    onSuccess: () => {
      message.info('评价邀请已发送');
    },
  });

  const [reassignModalOpen, toggleReassignModal] = useToggle(false);
  const [closeModalOpen, toggleCloseModal] = useToggle(false);

  const messageListRef = useRef<MessageListRef>(null);

  const keyword = content.startsWith('/') ? content.slice(1) : undefined;

  if (!conversation) {
    return;
  }

  const closed = conversation.status === ConversationStatus.Closed;

  return (
    <ConversationContext.Provider value={{ conversation }}>
      <div className="h-full flex">
        <div className="h-full flex flex-col overflow-hidden relative grow bg-white">
          <div className="shrink-0 h-[70px] box-content border-b flex items-center px-5">
            <div className="text-[20px] font-medium truncate mr-auto">{conversation.id}</div>
            <div className="ml-2 shrink-0 flex items-center gap-3">
              {conversation.operatorId && (
                <OperatorLabel
                  operatorId={conversation.operatorId}
                  onClick={toggleReassignModal}
                  disabled={closed}
                />
              )}
              <Tooltip title="历史消息" placement="bottom" mouseEnterDelay={0.5}>
                <button
                  className={cx('text-[#969696] p-1 rounded transition-colors', {
                    'bg-[#f0f0f0]': visitorMessageMode,
                    'hover:bg-[#f7f7f7]': !visitorMessageMode,
                  })}
                  onClick={() => setVisitorMessageMode(!visitorMessageMode)}
                >
                  <AiOutlineClockCircle className="w-5 h-5" />
                </button>
              </Tooltip>
              {!closed && (
                <Tooltip title="结束会话" placement="bottom" mouseEnterDelay={0.5}>
                  <button
                    className="text-[#969696] p-1 rounded transition-colors hover:bg-[#f7f7f7]"
                    onClick={() => {
                      if (conversation.categoryId) {
                        if (!isClosing) {
                          close();
                        }
                      } else {
                        toggleCloseModal();
                      }
                    }}
                  >
                    <FiCheck className="w-5 h-5" />
                  </button>
                </Tooltip>
              )}

              <Dropdown
                trigger={['click']}
                placement="bottomRight"
                menu={{
                  items: [
                    {
                      key: 'reassign',
                      icon: <FaUserEdit />,
                      label: '重新分配',
                      onClick: toggleReassignModal,
                      disabled: closed,
                    },
                  ],
                }}
              >
                <button className="text-[#969696] p-1 rounded transition-colors hover:bg-[#f7f7f7]">
                  <HiDotsHorizontal className="w-5 h-5" />
                </button>
              </Dropdown>
            </div>
          </div>

          <MessageList ref={messageListRef} className="grow" history={visitorMessageMode} />

          <div className="border-t border-[#ececec] relative">
            {showQuickReply && (
              <QuickReply
                onSelect={(content) => {
                  setContent(content);
                  setShowQuickReply(false);
                  textareaRef.current?.focus();
                }}
                onClose={() => {
                  setShowQuickReply(false);
                  textareaRef.current?.focus();
                }}
                keyword={keyword}
              />
            )}

            <div className="p-2 border-b space-x-1">
              <Button size="small" disabled={closed} onClick={() => _inviteEvaluation()}>
                {conversation.evaluationInvitedAt
                  ? '邀请评价(已邀请)'
                  : conversation.evaluation
                  ? '邀请评价(已评价)'
                  : '邀请评价'}
              </Button>
              <Button
                size="small"
                disabled={closed}
                onClick={() => setShowQuickReply((show) => !show)}
              >
                快捷回复
              </Button>
            </div>
            <div className="relative">
              <textarea
                ref={textareaRef}
                className="outline-none resize-none w-full placeholder:!text-[#a8a8a8] leading-5 bg-white"
                disabled={closed}
                placeholder={closed ? '会话已结束' : 'Enter 发送, Shift + Enter 换行'}
                value={closed ? '' : content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setShowQuickReply(e.target.value.startsWith('/'));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (closed || e.shiftKey) {
                      return;
                    }
                    e.preventDefault();
                    handleCreateMessage();
                  }
                }}
                onPasteCapture={(e) => {
                  const { files } = e.clipboardData;
                  if (files.length) {
                    e.preventDefault();
                    const file = files[0];
                    Modal.confirm({
                      title: '发送附件',
                      content: (
                        <>
                          <p>检测到您粘贴了一个文件，是否以附件的形式发送？</p>
                          <p>文件名：{file.name}</p>
                          {file.type.startsWith('image/') && (
                            <p className="text-center">
                              <Divider style={{ fontSize: 14 }}>预览</Divider>
                              <img
                                className="inline-block outline max-w-full max-h-[400px] object-contain bg-black"
                                src={URL.createObjectURL(file)}
                              />
                            </p>
                          )}
                        </>
                      ),
                      onOk: () => sendFileMessage(file),
                    });
                  }
                }}
                style={{
                  boxShadow: 'unset',
                  padding: '16px 14px',
                }}
              />
              {uploading && (
                <div className="absolute inset-0 p-4 bg-white flex flex-col justify-center items-center">
                  <Progress
                    percent={uploadPercent}
                    showInfo={false}
                    size="small"
                    style={{ margin: 0 }}
                  />
                  <div className="text-xs mt-1">上传中</div>
                </div>
              )}
            </div>
            <div className="px-5 pb-5 flex justify-between">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const { files } = e.target;
                    if (files && files.length) {
                      sendFileMessage(files[0]).then(() => {
                        fileInputRef.current.value = '';
                      });
                    }
                  }}
                />
                <Button
                  icon={<AiOutlinePaperClip className="w-[18px] h-[18px] mt-0.5" />}
                  onClick={() => fileInputRef.current.click()}
                  disabled={uploading || closed}
                />
              </div>
              <Button
                className="h-[34px] border-none"
                type="primary"
                disabled={content.trim() === '' || closed}
                onClick={handleCreateMessage}
              >
                发送
              </Button>
            </div>

            {!conversation.operatorId && !closed && (
              <Mask>
                <JoinConversationMask onJoin={joinConversation} />
              </Mask>
            )}

            {reopen && closed && (
              <Mask>
                <div className="text-center">
                  <div className="text-sm mb-2">会话已结束</div>
                  <Button type="primary" onClick={onReopen}>
                    重新打开
                  </Button>
                  <div className="text-sm mt-2">(若用户开启了新的会话, 重新打开将失败)</div>
                </div>
              </Mask>
            )}
          </div>
        </div>

        <ReassignModal open={reassignModalOpen} onClose={toggleReassignModal} />

        <CloseConfirm
          key={conversationId}
          open={closeModalOpen}
          onCancel={toggleCloseModal}
          onClose={handleClose}
          loading={isUpdating || isClosing}
        />

        <ConversationDetail className="w-[320px] border-l shrink-0" />
      </div>
    </ConversationContext.Provider>
  );
}

function Mask({ children }: PropsWithChildren) {
  return (
    <div className="absolute inset-0 bg-white bg-opacity-75 backdrop-blur-[2px] flex justify-center items-center">
      {children}
    </div>
  );
}

interface JoinConversationMaskProps {
  onJoin: () => void;
}

function JoinConversationMask({ onJoin }: JoinConversationMaskProps) {
  return (
    <div className="text-center">
      <Button type="primary" onClick={onJoin}>
        加入会话
      </Button>
    </div>
  );
}
