import { FunctionComponent, PropsWithChildren, createElement } from 'react';

export class Compose {
  private componentConfigs: [FunctionComponent<any>, any][] = [];

  push<P extends PropsWithChildren>(component: FunctionComponent<P>, props?: P) {
    this.componentConfigs.push([component, props]);
    return this;
  }

  assemble(): FunctionComponent<PropsWithChildren> {
    const configs = this.componentConfigs.slice().reverse();
    return ({ children }: PropsWithChildren) => {
      for (const [component, props] of configs) {
        children = createElement(component, { ...props }, children);
      }
      return children;
    };
  }
}
