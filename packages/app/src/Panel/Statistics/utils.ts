import _ from 'lodash';

export function renderTime(ms: any) {
  if (typeof ms !== 'number' || ms < 0) {
    return;
  }

  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));

  let timeString = '';
  if (hours > 0) {
    timeString += hours + '小时';
  }
  if (minutes > 0) {
    timeString += minutes + '分';
  }
  if (seconds > 0 || timeString === '') {
    timeString += seconds + '秒';
  }
  return timeString;
}

interface FlowContext {
  stack: any[];
  data: any;
}

type FlowOperation = (ctx: FlowContext) => void;

export function flow(...operations: FlowOperation[]) {
  return (data: any) => {
    const ctx: FlowContext = {
      stack: [],
      data,
    };
    for (const op of operations) {
      op(ctx);
    }
    return _.last(ctx.stack) ?? '-';
  };
}

export function push(field: string): FlowOperation {
  return (ctx) => {
    ctx.stack.push(_.get(ctx.data, field));
  };
}

export function pushValue(value: any): FlowOperation {
  return (ctx) => {
    ctx.stack.push(value);
  };
}

export function divide(): FlowOperation {
  return (ctx) => {
    const a = ctx.stack.pop();
    const b = ctx.stack.pop();
    if (typeof a === 'number' && typeof b === 'number' && a !== 0) {
      ctx.stack.push(b / a);
    } else {
      ctx.stack.push(undefined);
    }
  };
}

export function multiply(): FlowOperation {
  return (ctx) => {
    const a = ctx.stack.pop();
    const b = ctx.stack.pop();
    if (typeof a === 'number' && typeof b === 'number') {
      ctx.stack.push(a * b);
    } else {
      ctx.stack.push(undefined);
    }
  };
}

export function add(value?: number): FlowOperation {
  return (ctx) => {
    const augend = ctx.stack.pop();
    const addend = value ?? ctx.stack.pop();
    if (typeof augend === 'number' && typeof addend === 'number') {
      ctx.stack.push(augend + addend);
    } else {
      ctx.stack.push(undefined);
    }
  };
}

export function subtract(value?: number): FlowOperation {
  return (ctx) => {
    const a = ctx.stack.pop();
    const b = value ?? ctx.stack.pop();
    if (typeof a === 'number' && typeof b === 'number') {
      ctx.stack.push(b - a);
    } else {
      ctx.stack.push(undefined);
    }
  };
}

export function percent(): FlowOperation {
  return (ctx) => {
    const value = ctx.stack.pop();
    if (typeof value === 'number') {
      ctx.stack.push((value * 100).toFixed(2) + '%');
    } else {
      ctx.stack.push(undefined);
    }
  };
}

export function timeDuration(): FlowOperation {
  return (ctx) => {
    const value = ctx.stack.pop();
    if (typeof value === 'number') {
      ctx.stack.push(renderTime(value));
    } else {
      ctx.stack.push(undefined);
    }
  };
}

export function defaultValue(defaultValue: any): FlowOperation {
  return (ctx) => {
    const value = ctx.stack.pop();
    if (value === undefined || value === null) {
      ctx.stack.push(defaultValue);
    } else {
      ctx.stack.push(value);
    }
  };
}

export function fixed(fraction?: number): FlowOperation {
  return (ctx) => {
    const value = ctx.stack.pop();
    if (typeof value === 'number') {
      ctx.stack.push(value.toFixed(fraction));
    } else {
      ctx.stack.push(undefined);
    }
  };
}
