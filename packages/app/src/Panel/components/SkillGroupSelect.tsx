import { forwardRef } from 'react';
import { RefSelectProps, Select, SelectProps } from 'antd';

import { useSkillGroups } from '../hooks/skill-group';
import { SkillGroup } from '../types';

export const SkillGroupSelect = forwardRef<RefSelectProps, SelectProps<any, SkillGroup>>(
  (props, ref) => {
    const { data, isLoading } = useSkillGroups();

    return (
      <Select
        ref={ref}
        options={data}
        loading={isLoading}
        fieldNames={{ label: 'name', value: 'id' }}
        optionFilterProp="name"
        {...props}
      />
    );
  },
);
