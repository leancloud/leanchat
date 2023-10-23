import { ChatManager } from './chat-manager';

const LeanChat = new ChatManager();

if (import.meta.env.PROD) {
  LeanChat.uri = new URL(import.meta.env.BASE_URL).origin;
  (window as any).LeanChat = LeanChat;
} else {
  LeanChat.uri = new URL('/', window.top?.location.origin).origin;
  LeanChat.render();
}
