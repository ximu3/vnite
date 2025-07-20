export enum UserRole {
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  COMMUNITY = 'community',
  PREMIUM = 'premium'
}

export interface UserQuota {
  maxStorage: number
}

interface RoleQuotas {
  [UserRole.ADMIN]: UserQuota
  [UserRole.PREMIUM]: UserQuota
  [UserRole.DEVELOPER]: UserQuota
  [UserRole.COMMUNITY]: UserQuota
}

export const ROLE_QUOTAS: RoleQuotas = {
  admin: {
    maxStorage: 3 * 1024 * 1024 * 1024
  },
  premium: {
    maxStorage: 1 * 1024 * 1024 * 1024
  },
  developer: {
    maxStorage: 1 * 1024 * 1024 * 1024
  },
  community: {
    maxStorage: 300 * 1024 * 1024
  }
}
