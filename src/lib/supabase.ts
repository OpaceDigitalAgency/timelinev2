import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase-types';

// Use the correct environment variable names as defined in .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Example auth functions
export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email,
    password
  });
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({
    email,
    password
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  return supabase.auth.getUser();
}