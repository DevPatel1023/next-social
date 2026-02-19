"use client";

import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/app/lib/supabase/client";
import type { AuthInput } from "@/app/lib/validation";

type AuthResult = {
  error: string | null;
  requiresEmailConfirmation?: boolean;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: AuthInput["email"], password: AuthInput["password"]) => Promise<AuthResult>;
  register: (email: AuthInput["email"], password: AuthInput["password"]) => Promise<AuthResult>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,

  fetchUser: async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    set({ user: data.user });
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = (await response.json()) as AuthResult;
      if (!response.ok) {
        return { error: result.error ?? "Login failed" };
      }

      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      set({ user: data.user });
      return { error: null };
    } finally {
      set({ loading: false });
    }
  },

  register: async (email, password) => {
    set({ loading: true });
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = (await response.json()) as AuthResult;
      if (!response.ok) {
        return { error: result.error ?? "Registration failed" };
      }

      if (result.requiresEmailConfirmation) {
        set({ user: null });
        return { error: null, requiresEmailConfirmation: true };
      }

      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      set({ user: data.user });
      return { error: null, requiresEmailConfirmation: false };
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
