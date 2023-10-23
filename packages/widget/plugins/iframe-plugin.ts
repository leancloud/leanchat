import { Plugin } from 'vite';

type DeepPartial<T> = {
  [K in keyof T]?: DeepPartial<T[K]>;
};

function flattenKeys(obj: Record<string, any>, parentKey = '') {
  let result: Record<string, any> = {};

  for (const key in obj) {
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      const nestedKeys = flattenKeys(obj[key], parentKey + key + '.');
      result = { ...result, ...nestedKeys };
    } else {
      result[parentKey + key] = obj[key];
    }
  }

  return result;
}

export interface IFramePluginOptions {
  filename: string;
  attributes?: DeepPartial<HTMLIFrameElement>;
}

export function iframePlugin({ filename, attributes }: IFramePluginOptions): Plugin {
  let indexHtml = '';

  return {
    name: 'vite:iframe-plugin',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        indexHtml = html;
      },
    },
    generateBundle() {
      indexHtml = indexHtml.replace(/<!DOCTYPE[^>]*>/i, '').replace(/[\r\n]/g, '');

      const convertCode: string[] = [];
      if (attributes) {
        const flatAttrs = flattenKeys(attributes);
        Object.entries(flatAttrs).forEach(([key, value]) => {
          convertCode.push(`iframe.${key} = ${JSON.stringify(value)}`);
        });
      }

      const code = [
        `const html = ${JSON.stringify(indexHtml)};`,
        `const iframe = document.createElement('iframe');`,
        ...convertCode,
        `document.body.appendChild(iframe);`,
        `iframe.contentDocument.open();`,
        `iframe.contentDocument.write(html);`,
        `iframe.contentDocument.close();`,
      ].join('\n');

      this.emitFile({
        type: 'prebuilt-chunk',
        code,
        fileName: filename,
      });
    },
  };
}
