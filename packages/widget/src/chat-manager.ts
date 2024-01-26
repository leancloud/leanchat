import mitt from 'mitt';

import css from './index.css?inline';
import loading from './assets/loading.svg?raw';

function createLoadingElement() {
  const div = document.createElement('div');
  div.innerHTML = loading;
  resetElementStyle(div);
  div.style.position = 'fixed';
  div.style.inset = 'auto 0px 10px 0px';
  return div;
}

function resetElementStyle(e: HTMLElement) {
  e.style.display = 'block';
  e.style.margin = '0';
  e.style.padding = '0';
  e.style.border = 'none';
}

export class ChatManager {
  iframe?: HTMLIFrameElement;
  uri = '/';
  inited = false;
  emitter = mitt();

  static getToken() {
    return localStorage.getItem('LeanChat/token') ?? undefined;
  }

  static setToken(token: string) {
    localStorage.setItem('LeanChat/token', token);
  }

  async _setDisplay(display: boolean) {
    if (!this.iframe) return;
    if (display) {
      this.iframe.style.display = 'block';
    } else {
      this.iframe.style.display = 'none';
    }
    this.emitter.emit('display', display);
  }

  async open() {
    if (this.inited) {
      this._setDisplay(true);
      return;
    }

    this.inited = true;

    const topWindow = window.top || window;

    topWindow.document.body.dataset.overflow = document.body.style.overflow;

    const iframeContainer = document.createElement('div');
    iframeContainer.id = 'leanchat-container';
    topWindow.document.body.appendChild(iframeContainer);

    const loadingElement = createLoadingElement();
    iframeContainer.appendChild(loadingElement);

    const iframe = document.createElement('iframe');
    resetElementStyle(iframe);
    iframe.style.display = 'none';
    iframe.style.zIndex = '2147483000';
    this.iframe = iframe;

    const { io } = await import('socket.io-client');
    const socket = io(this.uri, {
      transports: ['websocket'],
      auth: {
        token: ChatManager.getToken(),
        url: topWindow.location.href,
      },
      autoConnect: false,
    });
    socket.on('signedUp', ({ token }) => {
      ChatManager.setToken(token);
    });

    const { render } = await import('./App');

    iframe.onload = () => {
      const style = document.createElement('style');
      style.textContent = css;
      iframe.contentDocument?.head.appendChild(style);

      const rootElement = document.createElement('div');
      iframe.contentDocument?.body.appendChild(rootElement);
      render(rootElement, {
        iframe,
        socket,
        emitter: this.emitter,
        getDisplay: () => iframe.style.display !== 'none',
      });

      socket.connect();
    };

    this.emitter.on('initialized', () => {
      iframeContainer.removeChild(loadingElement);
      this._setDisplay(true);
    });

    this.emitter.on('close', () => {
      this._setDisplay(false);
    });

    iframeContainer.appendChild(iframe);
  }
}
