export interface Message {
  id: string;
  visitorId: string;
  conversationId: string;
  type: number;
  from: {
    type: number;
    id: string;
  };
  data: any;
  createdAt: string;
}

export interface Evaluation {
  star: number;
  feedback?: string;
  createdAt: string;
}

export interface ConversationStats {
  visitorMessageCount?: number;
  operatorMessageCount?: number;
  firstResponseTime?: number;
  maxResponseTime?: number;
  responseTime?: number;
  responseCount?: number;
  averageResponseTime?: number;
  receptionTime?: number;
  firstOperatorJoinedAt?: string;
  reassigned?: boolean;
  operatorFirstMessageCreatedAt?: string;
  operatorLastMessageCreatedAt?: string;
  visitorFirstMessageCreatedAt?: string;
  visitorLastMessageCreatedAt?: string;
  queueConnectionTime?: number;
  queueTimeToLeave?: number;
  consultationResult?: number;
  duration?: number;
  round?: number;
}

export interface Conversation {
  id: string;
  channel: Channel;
  source?: {
    url?: string;
  };
  status: ConversationStatus;
  visitorId: string;
  visitor?: {
    id: string;
    name?: string;
  };
  operatorId?: string;
  lastMessage?: Message;
  categoryId?: string;
  evaluation?: Evaluation;
  evaluationInvitedAt?: string;
  visitorWaitingSince?: string;
  createdAt: string;
  queuedAt?: string;
  closedAt?: string;
  closedBy?: {
    type: number;
    id?: string;
  };
  stats?: ConversationStats;
  joinedOperatorIds?: string[];
}

export enum Channel {
  LiveChat = 1,
  WeChat = 2,
}

export enum OperatorRole {
  Operator = 1,
  Admin = 2,
  Inspector = 3,
}

export interface Operator {
  id: string;
  role: OperatorRole;
  username: string;
  externalName: string;
  internalName: string;
  concurrency: number;
  status: OperatorStatus;
  workload: number;
}

export enum OperatorStatus {
  Ready = 1,
  Busy = 2,
  Leave = 3,
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
}

export interface QuickReply {
  id: string;
  content: string;
  tags?: string[];
  operatorId?: string;
}

export interface Visitor {
  id: string;
  name?: string;
  comment?: string;
}

export enum UserType {
  Visitor = 1,
  Operator = 2,
  System = 3,
  Chatbot = 4,
}

export enum ConsultationResult {
  Valid = 1,
  Invalid = 2,
  OperatorNoResponse = 3,
}

export enum MessageType {
  Message = 1,
  Evaluate = 2,
  Close = 3,
  Assign = 4,
  Reopen = 5,
}

export enum ConversationStatus {
  Open = 1,
  Closed = 2,
}

export interface OperatorGroup {
  id: string;
  name: string;
  operatorIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatbotMessage {
  text: string;
}

export interface Chatbot {
  id: string;
  name: string;
  acceptRule?: number;
  workingTime?: {
    start: number;
    end: number;
  };
  globalQuestionBaseIds: string[];
  initialQuestionBaseIds: string[];
  greetingMessage: ChatbotMessage;
  noMatchMessage: ChatbotMessage;
}

export interface ChatbotQuestionBase {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatbotQuestion {
  id: string;
  matcher: number;
  question: string;
  similarQuestions?: string[];
  answer: ChatbotMessage;
  nextQuestionBaseId?: string;
  assignOperator?: boolean;
  createdAt: string;
  updatedAt: string;
}
