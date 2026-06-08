/**
 * Server-side in-memory user store shared by the mock API routes.
 *
 * On first access the store lazily loads all AppUsers from PostgreSQL so
 * that demo accounts always work even though TENANT_USERS is now empty.
 * Created / updated / deleted users are held here for the lifetime of the
 * Next.js server process. In production the real C# / PostgreSQL backend
 * handles authentication and user management.
 */

import { type TenantUser } from './tenantUsers';
import { getPool, UUID_TENANT } from './pgDb';

/** Singleton map keyed by user ID */
export const usersServerStore = new Map<string, TenantUser>();

let _seeded = false;
let _seeding = false;

/** Populate the store from the Users table on first access. */
async function seedFromDb(): Promise<void> {
  if (_seeded || _seeding) return;
  _seeding = true;
  try {
    const db = getPool();
    const { rows } = await db.query(`SELECT * FROM "Users" ORDER BY "Email"`);
    for (const u of rows) {
      const tid = u.TenantId ? (UUID_TENANT[(u.TenantId as string).toLowerCase()] ?? u.TenantId) : null;
      const user: TenantUser = {
        id:          u.Id,
        tenantId:    tid ?? '',
        tenantName:  '',           // resolved in login route from tenant slug
        tenantSlug:  '',
        firstName:   u.FirstName ?? '',
        lastName:    u.LastName  ?? '',
        email:       u.Email,
        password:    'Demo1234!', // demo only — real hash in PasswordHash column
        role:        u.Role,
        status:      u.Status ?? 'Active',
        mfaEnabled:  u.MfaEnabled ?? false,
        lastLogin:   'Never',
      };
      usersServerStore.set(u.Id, user);
    }
    _seeded = true;
  } catch (err) {
    console.error('[usersServerStore] DB seed failed:', err);
  } finally {
    _seeding = false;
  }
}

// Kick off seeding immediately when this module is first imported
seedFromDb();

export function getAllServerUsers(): TenantUser[] {
  return Array.from(usersServerStore.values());
}

export function getServerUserByEmail(email: string): TenantUser | undefined {
  const lower = email.toLowerCase();
  for (const u of usersServerStore.values()) {
    if (u.email.toLowerCase() === lower) return u;
  }
  return undefined;
}

export function upsertServerUser(user: TenantUser): void {
  usersServerStore.set(user.id, user);
}

export function deleteServerUser(id: string): void {
  usersServerStore.delete(id);
}
