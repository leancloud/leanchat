import { forwardRef } from 'react';
import { RefSelectProps, Select, SelectProps } from 'antd';

export const ChannelSelect = forwardRef<RefSelectProps, SelectProps>((props, ref) => {
  return (
    <Select
      ref={ref}
      placeholder="咨询渠道"
      options={[
        {
          label: '在线聊天',
          value: 'widget',
        },
      ]}
      {...props}
    />
  );
});
