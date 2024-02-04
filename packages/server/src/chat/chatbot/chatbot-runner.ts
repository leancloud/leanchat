import Handlebars from 'handlebars';
import ivm from 'isolated-vm';
import { z } from 'zod';
import _ from 'lodash';

import type { ConfigService } from 'src/config';
import { ChatbotContext } from '../interfaces';
import type { Chatbot, ChatbotQuestion } from '../models';
import type { ChatService, ChatbotQuestionService } from '../services';

interface ChatbotRunnerOptions {
  conversationId: string;
  chatbot: Chatbot;
  context: ChatbotContext;
  chatService: ChatService;
  questionService: ChatbotQuestionService;
  configService: ConfigService;
}

interface QuestionHandle {
  context: ChatbotContext;
  input: string;
  answer: string;
  assignOperator: boolean;
}

const ChatbotContextSchema = z
  .object({
    questionBaseIds: z.array(z.string()),
    operatorAssigned: z.boolean(),
    data: z.record(z.any()),
  })
  .partial();

const QuestionHandleSchema = z
  .object({
    context: ChatbotContextSchema,
    input: z.string(),
    answer: z.string(),
    assignOperator: z.boolean(),
  })
  .partial();

class ChatHandle {
  constructor(
    private _conversationId: string,
    private _chatService: ChatService,
    private _configService: ConfigService,
  ) {}

  async getMaxQueueLength() {
    const config = await this._configService.get('queue');
    if (config) {
      return config.capacity;
    }
    return 0;
  }

  async getQueueLength() {
    return this._chatService.getQueueLength();
  }

  async getQueuePosition() {
    return this._chatService.getQueuePosition(this._conversationId);
  }

  async hasReadyOperator() {
    return this._chatService.hasReadyOperator();
  }
}

export class ChatbotRunner {
  conversationId: string;

  chatbot: Chatbot;

  context: ChatbotContext;

  chatService: ChatService;

  questionService: ChatbotQuestionService;

  configService: ConfigService;

  answer = '';

  assignOperator = false;

  constructor(options: ChatbotRunnerOptions) {
    this.conversationId = options.conversationId;
    this.chatbot = options.chatbot;
    this.context = options.context;
    this.chatService = options.chatService;
    this.questionService = options.questionService;
    this.configService = options.configService;
  }

  async run(input?: string) {
    const { chatbot, context, questionService } = this;

    if (input) {
      if (chatbot.globalQuestionBaseIds.length) {
        const question = await questionService.matchQuestion(
          chatbot.globalQuestionBaseIds,
          input,
        );
        if (question) {
          return await this.processQuestion(question, input);
        }
      }

      if (!context.questionBaseIds) {
        context.questionBaseIds = chatbot.initialQuestionBaseIds.map((id) =>
          id.toString(),
        );
      }

      if (context.questionBaseIds.length) {
        const question = await questionService.matchQuestion(
          context.questionBaseIds,
          input,
        );
        if (question) {
          return await this.processQuestion(question, input, true);
        }
      }
    }

    this.answer = chatbot.noMatchMessage.text;
  }

  private async processQuestion(
    question: ChatbotQuestion,
    input: string,
    switchBase = false,
  ) {
    const { context } = this;
    const questionHandle: QuestionHandle = {
      context,
      input,
      answer: '',
      assignOperator: false,
    };

    const template = Handlebars.compile(question.answer.text);
    const queuePosition = await this.chatService.getQueuePosition(
      this.conversationId,
    );
    questionHandle.answer = template({
      context,
      queue: {
        position: queuePosition,
      },
    }).trim();

    if (switchBase && question.nextQuestionBaseId) {
      context.questionBaseIds = [question.nextQuestionBaseId.toString()];
    }

    if (question.assignOperator && !context.operatorAssigned) {
      questionHandle.assignOperator = true;

      const queueConfig = await this.configService.get('queue');
      if (queueConfig && queueConfig.capacity > 0) {
        const queueLength = await this.chatService.getQueueLength();
        if (queueLength >= queueConfig.capacity) {
          questionHandle.assignOperator = false;
          questionHandle.answer = queueConfig.fullMessage.text;
        }
      }
    }

    if (question.code) {
      try {
        await this.runCode(question.code, questionHandle);
      } catch {}
    }

    this.answer = questionHandle.answer;
    this.assignOperator = questionHandle.assignOperator;

    if (this.assignOperator) {
      this.context.operatorAssigned = true;
    }
  }

  private async runCode(code: string, handle: QuestionHandle) {
    const chatHandle = new ChatHandle(
      this.conversationId,
      this.chatService,
      this.configService,
    );

    const vm = new ivm.Isolate({ memoryLimit: 16 });
    const context = await vm.createContext();

    await context.global.set('question', handle, { copy: true });

    await context.global.set('_chat', await createReference(chatHandle));
    await initChatHandle(vm, context);

    const script = await vm.compileScript(code);
    await script.run(context, { timeout: 5000 });

    const innerHandle = await getReferenceValue(
      context.global,
      'question',
      QuestionHandleSchema,
    );

    if (innerHandle) {
      Object.assign(this.context, _.pick(innerHandle.context, ['data']));
      Object.assign(handle, _.pick(innerHandle, ['answer', 'assignOperator']));
    }
  }
}

async function createReference(value: any, meet = new Set()) {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Bad value');
  }

  const ref = new ivm.Reference<Record<string, any>>({});

  const _this = value;
  let current = value;
  while (current) {
    const names = Object.getOwnPropertyNames(current).filter(
      (name) => !name.startsWith('_'),
    );

    for (const name of names) {
      const value = current[name];

      switch (typeof value) {
        case 'undefined':
          continue;
        case 'object':
          if (value === null) {
            await ref.set(name, value);
          } else if (!meet.has(value)) {
            meet.add(value);
            await ref.set(name, await createReference(value, meet));
          }
          break;
        case 'function':
          await ref.set(name, new ivm.Reference(value.bind(_this)));
          break;
        default:
          await ref.set(name, value);
          break;
      }
    }

    current = Object.getPrototypeOf(current);
    if (current === Object.prototype) {
      break;
    }
  }

  return ref;
}

async function initChatHandle(vm: ivm.Isolate, context: ivm.Context) {
  const script = await vm.compileScript(
    `;(${() => {
      const chat = new Proxy(this._chat as ivm.Reference, {
        get: (target, p) => {
          const value = target.getSync(p);
          switch (value.typeof) {
            case 'function':
              return (...args: any[]) => value.applySyncPromise(null, args);
          }
          return value;
        },
      });
      this.chat = chat;
      delete this._chat;
    }})();`,
  );
  await script.run(context);
}

async function getReferenceValue(
  ref: ivm.Reference,
  path: string,
  schema?: z.Schema,
) {
  let value = await ref.get(path);
  if (value instanceof ivm.Reference) {
    value = await value.copy();
  }
  if (schema) {
    const result = schema.safeParse(value);
    if (result.success) {
      value = result.data;
    } else {
      value = undefined;
    }
  }
  return value;
}
