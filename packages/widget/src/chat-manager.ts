import type { Root } from 'react-dom/client';
import type { Socket } from 'socket.io-client';

import css from './index.css?inline';

export class ChatManager {
  minimized = false;
  iframeContainer?: HTMLDivElement;
  iframe?: HTMLIFrameElement;
  socket?: Socket;
  reactRoot?: Root;
  uri = '/';

  static getToken() {
    return localStorage.getItem('LeanChat/token') ?? undefined;
  }

  static setToken(token: string) {
    localStorage.setItem('LeanChat/token', token);
  }

  async render() {
    if (!this.iframeContainer) {
      this.iframeContainer = document.createElement('div');
      this.iframeContainer.id = 'leanchat-container';
    }
    if (!this.iframe) {
      this.iframe = document.createElement('iframe');
      this.iframe.style.position = 'fixed';
      this.iframe.style.inset = 'auto 0px 0px auto';
      this.iframe.style.border = 'none';
      this.iframe.style.width = '415px';
      this.iframe.style.height = '520px';
      this.iframeContainer.appendChild(this.iframe);
    }

    if (!this.socket) {
      const { io } = await import('socket.io-client');
      this.socket = io(this.uri, {
        transports: ['websocket'],
        auth: {
          token: ChatManager.getToken(),
        },
        autoConnect: false,
      });
      this.socket.on('signedUp', ({ token }) => {
        ChatManager.setToken(token);
      });
    }

    if (!this.reactRoot) {
      const { render } = await import('./App');
      this.iframe.onload = () => {
        if (this.iframe && this.socket) {
          const style = document.createElement('style');
          style.textContent = css;
          this.iframe.contentDocument?.head.appendChild(style);

          const rootElement = document.createElement('div');
          this.iframe.contentDocument?.body.appendChild(rootElement);
          this.reactRoot = render(rootElement, {
            resize: () => {},
            iframe: this.iframe,
            socket: this.socket,
          });

          this.socket.connect();
        }
      };
    }

    window.top?.document.body.appendChild(this.iframeContainer);
  }
}
