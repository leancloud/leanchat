import { ComponentProps, forwardRef } from 'react';

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<'textarea'>>(
  (props, ref) => {
    return (
      <textarea
        {...props}
        ref={ref}
        className="resize-none w-full h-full outline-none p-[10px] leading-5 outline outline-0 outline-offset-0 outline-[#0088ff] focus:outline-1"
        placeholder="我想问..."
        style={{
          boxShadow: 'rgb(170, 170, 170) 0px 0px 5px inset',
        }}
      />
    );
  },
);
