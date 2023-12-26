import { PropsWithChildren } from 'react';
import { Result } from 'antd';

import { OperatorRole } from '../types';
import { useCurrentUser } from '../auth';

export function RequireRole({ roles, children }: PropsWithChildren<{ roles: OperatorRole[] }>) {
  const user = useCurrentUser();
  if (!roles.includes(user.role)) {
    return <Result status="403" title="未经授权的访问" subTitle="对不起，您没有权限访问此页面。" />;
  }
  return children;
}
