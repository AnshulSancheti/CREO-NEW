import { randomUUID } from 'crypto';

export type StoredUser = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

const users = new Map<string, StoredUser>();

export const findUserByEmail = (email: string) => {
  const normalized = email.trim().toLowerCase();
  return users.get(normalized) || null;
};

export const addUser = (email: string, passwordHash: string): StoredUser => {
  const normalized = email.trim().toLowerCase();
  const user: StoredUser = {
    id: randomUUID(),
    email: normalized,
    passwordHash,
    createdAt: new Date().toISOString()
  };
  users.set(normalized, user);
  return user;
};

export const getUserById = (id: string) => {
  for (const user of users.values()) {
    if (user.id === id) return user;
  }
  return null;
};
