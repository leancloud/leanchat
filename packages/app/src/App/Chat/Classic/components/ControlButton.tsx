import { ComponentProps } from 'react';

export function ControlButton(props: ComponentProps<'button'>) {
  return (
    <button
      {...props}
      className={`text-[rgb(102,102,102)] enabled:hover:text-[rgb(54,103,144)] disabled:opacity-40 ${
        props.className || ''
      }`}
    />
  );
}
