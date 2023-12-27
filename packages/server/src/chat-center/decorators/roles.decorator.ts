import { SetMetadata } from '@nestjs/common';

import type { OperatorRole } from 'src/chat/constants';
import { ALLOWED_ROLES } from '../constants';

export const Roles = (...roles: OperatorRole[]) =>
  SetMetadata(ALLOWED_ROLES, roles);
