import { ChatManager } from './chat-manager';

const LeanChat = new ChatManager();

if (window.top) {
  (window.top as any).LeanChat = LeanChat;
}

if (import.meta.env.PROD) {
  LeanChat.uri = new URL(import.meta.env.BASE_URL).origin;
} else {
  LeanChat.uri = new URL('/', window.top?.location.origin).origin;
}

if (window.top === window) {
  LeanChat.show();
}
