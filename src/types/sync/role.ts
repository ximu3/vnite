export enum UserRole {
  COMMUNITY = 'community',
  ADMIN = 'admin'
}

export interface UserQuota {
  maxStorage: number
}

interface RoleQuotas {
  [UserRole.COMMUNITY]: UserQuota
  [UserRole.ADMIN]: UserQuota
}

export const ROLE_QUOTAS: RoleQuotas = {
  community: {
    maxStorage: 300 * 1024 * 1024
  },
  admin: {
    maxStorage: 3 * 1024 * 1024 * 1024
  }
}
