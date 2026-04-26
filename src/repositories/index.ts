// Repository factory — switch the active provider here.
// Every consumer in the app imports from this module, never from /supabase/* directly.
import type { Repositories } from './types';
import { supabaseAuth } from './supabase/auth';
import { supabaseAreas } from './supabase/areas';
import { supabaseTypes } from './supabase/types';
import { supabaseItems } from './supabase/items';

const supabaseRepositories: Repositories = {
  auth: supabaseAuth,
  areas: supabaseAreas,
  types: supabaseTypes,
  items: supabaseItems,
};

export const repositories: Repositories = supabaseRepositories;

export type { Repositories } from './types';
