export enum UserRole {
  COMMUNITY = 'community',
  ADMIN = 'admin'
}

// 用户配额定义
export interface UserQuota {
  maxStorage: number // 单位: MB
}

interface RoleQuotas {
  [UserRole.COMMUNITY]: UserQuota
  [UserRole.ADMIN]: UserQuota
}

// 角色对应的配额
export const ROLE_QUOTAS: RoleQuotas = {
  community: {
    maxStorage: 300
  },
  admin: {
    maxStorage: 1024 * 3
  }
}
