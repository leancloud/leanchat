import { ChatManager } from './chat-manager';

const LeanChat = new ChatManager();
const topWindow = window.top || window;

(topWindow as any).LeanChat = LeanChat;

if (import.meta.env.PROD) {
  LeanChat.uri = new URL(import.meta.env.BASE_URL).origin;
} else {
  LeanChat.uri = new URL('/', topWindow.location.origin).origin;
}

if (topWindow === window) {
  LeanChat.open();
}
