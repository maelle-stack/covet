import type { ISODateTimeString, UUID } from '../common';

export const AUTH_PROVIDERS = ['phone', 'email', 'apple'] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

/**
 * Link between a Covet user and an auth provider identity. Credentials,
 * password hashes, and tokens stay inside the auth provider (Supabase Auth);
 * this record only tracks which sign-in methods a user has.
 */
export interface AuthIdentity {
  id: UUID;
  userId: UUID;
  provider: AuthProvider;
  providerUserId: string;
  email: string | null;
  phoneNumber: string | null; // E.164
  createdAt: ISODateTimeString;
  lastAuthenticatedAt: ISODateTimeString | null;
}
