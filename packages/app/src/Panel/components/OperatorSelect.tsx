import { forwardRef } from 'react';
import { SelectProps, RefSelectProps, Select } from 'antd';

import { useOperators } from '../hooks/operator';
import { Operator } from '../types';

export const OperatorSelect = forwardRef<RefSelectProps, SelectProps<any, Operator>>(
  (props, ref) => {
    const { data: operators, isLoading } = useOperators();

    return (
      <Select
        ref={ref}
        loading={isLoading}
        options={operators}
        fieldNames={{ label: 'internalName', value: 'id' }}
        optionFilterProp="internalName"
        {...props}
      />
    );
  },
);
