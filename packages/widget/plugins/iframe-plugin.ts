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
          convertCode.push(`f.${key} = ${JSON.stringify(value)}`);
        });
      }

      const lines = [
        `var h = ${JSON.stringify(indexHtml)};`,
        `var f = d.createElement('iframe');`,
        ...convertCode,
        `d.body.appendChild(f);`,
        `f.contentDocument.open();`,
        `f.contentDocument.write(h);`,
        `f.contentDocument.close();`,
      ];
      const iifeBody = lines.map((line) => '  ' + line).join('\n');
      const code = `(function(d){\n${iifeBody}\n})(document);`;

      this.emitFile({
        type: 'prebuilt-chunk',
        code,
        fileName: filename,
      });
    },
  };
}
