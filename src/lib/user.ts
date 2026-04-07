import { AuthUser, SystemUser } from '../types';

export function authToSystemUser(u: AuthUser | any): SystemUser {
  const id = u?.id !== undefined ? String(u.id) : 'usr-' + Math.random().toString(36).substr(2, 8);
  const fullName = u?.fullName ?? u?.full_name ?? u?.username ?? '';
  const email = u?.email ?? '';
  const phone = u?.phone ?? '';
  const role = (u?.role as any) ?? 'viewer';
  const status = (u?.status as any) ?? 'active';
  const department = u?.department ?? '';
  const createdAt = u?.createdAt ?? new Date().toISOString().split('T')[0];
  const lastLogin = u?.lastLogin ?? u?.last_login ?? undefined;
  const avatar = u?.avatar ?? undefined;
  const notes = u?.notes ?? '';

  return {
    id,
    fullName,
    email,
    phone,
    role,
    status,
    department,
    createdAt,
    lastLogin,
    avatar,
    notes,
  } as SystemUser;
}

export function systemToAuthUser(s: SystemUser): AuthUser {
  return {
    id: s.id,
    username: s.email || s.fullName.replace(/\s+/g, '.').toLowerCase(),
    fullName: s.fullName,
    role: s.role,
    email: s.email,
  };
}
