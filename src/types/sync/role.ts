export enum UserRole {
  COMMUNITY = 'community',
  ADMIN = 'admin'
}

// 用户配额定义
export interface UserQuota {
  maxStorage: number
}

interface RoleQuotas {
  [UserRole.COMMUNITY]: UserQuota
  [UserRole.ADMIN]: UserQuota
}

// 角色对应的配额
export const ROLE_QUOTAS: RoleQuotas = {
  community: {
    maxStorage: 300 * 1024 * 1024
  },
  admin: {
    maxStorage: 3 * 1024 * 1024 * 1024
  }
}
