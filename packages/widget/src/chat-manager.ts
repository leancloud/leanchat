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

  static getToken() {
    return localStorage.getItem('LeanChat/token') ?? undefined;
  }

  static setToken(token: string) {
    localStorage.setItem('LeanChat/token', token);
  }

  _showLoading() {
    console.log(loading);
  }

  async show() {
    if (this.inited) {
      if (this.iframe) {
        this.iframe.style.display = 'block';
      }
      return;
    }

    this.inited = true;

    const topWindow = window.top || window;

    const iframeContainer = document.createElement('div');
    iframeContainer.id = 'leanchat-container';
    topWindow.document.body.appendChild(iframeContainer);

    const loadingElement = createLoadingElement();
    iframeContainer.appendChild(loadingElement);

    const iframe = document.createElement('iframe');
    resetElementStyle(iframe);
    iframe.style.position = 'fixed';
    iframe.style.inset = 'auto 0px 0px auto';
    iframe.style.width = '415px';
    iframe.style.height = '520px';
    this.iframe = iframe;

    const { io } = await import('socket.io-client');
    const socket = io(this.uri, {
      transports: ['websocket'],
      auth: {
        token: ChatManager.getToken(),
      },
      autoConnect: false,
    });
    socket.on('signedUp', ({ token }) => {
      ChatManager.setToken(token);
    });
    socket.once('connect', () => {
      iframeContainer.removeChild(loadingElement);
    });

    const { render } = await import('./App');

    iframe.onload = () => {
      const style = document.createElement('style');
      style.textContent = css;
      iframe.contentDocument?.head.appendChild(style);

      const rootElement = document.createElement('div');
      iframe.contentDocument?.body.appendChild(rootElement);
      render(rootElement, {
        resize: () => {},
        iframe,
        socket,
      });

      socket.connect();
    };

    iframeContainer.appendChild(iframe);
  }
}
