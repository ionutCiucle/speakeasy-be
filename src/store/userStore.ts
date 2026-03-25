import { User } from '../types';

// In-memory store — replace with a real DB later
const users: Map<string, User> = new Map();

export const findUserByEmail = (email: string): User | undefined => {
  for (const user of users.values()) {
    if (user.email === email) return user;
  }
  return undefined;
};

export const findUserById = (id: string): User | undefined => users.get(id);

export const createUser = (user: User): User => {
  users.set(user.id, user);
  return user;
};
