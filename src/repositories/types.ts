// Pure repository interfaces — no backend coupling.
// Hooks consume these abstractions, allowing the underlying provider
// (Supabase today, anything else tomorrow) to be swapped behind one factory.
import type { Area, CalendarItem, ItemType } from '@/types';

export interface AuthUser {
  id: string;
  email: string | null;
  displayName?: string | null;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
}

export interface SignUpInput {
  email: string;
  password: string;
  displayName?: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export type AuthChangeCallback = (session: AuthSession | null) => void;

export interface AuthRepository {
  getSession(): Promise<AuthSession | null>;
  onAuthChange(cb: AuthChangeCallback): () => void;
  signUp(input: SignUpInput): Promise<void>;
  signIn(input: SignInInput): Promise<void>;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  updatePassword(newPassword: string): Promise<void>;
}

export interface AreasRepository {
  list(): Promise<Area[]>;
  create(area: Omit<Area, 'id'>): Promise<Area>;
  update(id: string, updates: Partial<Omit<Area, 'id'>>): Promise<void>;
  remove(id: string): Promise<void>;
  reorder(orderedIds: string[]): Promise<void>;
}

export interface TypesRepository {
  list(): Promise<ItemType[]>;
  create(t: Omit<ItemType, 'id'>): Promise<ItemType>;
  update(id: string, updates: Partial<Omit<ItemType, 'id'>>): Promise<void>;
  remove(id: string): Promise<void>;
  reorder(orderedIds: string[]): Promise<void>;
}

export interface ItemsRepository {
  list(): Promise<CalendarItem[]>;
  create(item: Omit<CalendarItem, 'id' | 'createdAt'>): Promise<CalendarItem>;
  update(id: string, updates: Partial<Omit<CalendarItem, 'id' | 'createdAt'>>): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface Repositories {
  auth: AuthRepository;
  areas: AreasRepository;
  types: TypesRepository;
  items: ItemsRepository;
}
