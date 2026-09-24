import type { Role } from '../types/api';

export const ROLE_LABEL: Record<Role, string> = {
  SUPER_MASTER: 'Super Master',
  SUPER_ADMIN: 'Super Admin',
  MASTER: 'Master',
  CLIENT: 'Client',
};

export const CREATABLE_ROLE: Record<Role, Role | null> = {
  SUPER_MASTER: 'SUPER_ADMIN',
  SUPER_ADMIN: 'MASTER',
  MASTER: 'CLIENT',
  CLIENT: null,
};

export function canCreateUsers(role: Role): boolean {
  return CREATABLE_ROLE[role] !== null;
}

export function canPostLedger(role: Role): boolean {
  return role !== 'CLIENT';
}

export function formatAmount(minorUnits: number): string {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(minorUnits);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function newIdempotencyKey(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
