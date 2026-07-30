"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";
import {
  hasPermission as hasPerm,
  canSeePrices as canSeePricesFn,
  type AuthUser,
  type Permission,
} from "./permissions";
import type { Vehicle } from "./vehicles";
import type { UserRole } from "./types";

const TOKEN_KEY = "inssup:token:v1";

export interface AuditInput {
  action: string;
  entity: string;
  entityId?: string;
  entityName?: string;
  summary?: string;
  changes?: unknown;
}

interface AuthValue {
  user: AuthUser | null;
  status: "loading" | "authed" | "anon";
  login: (username: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  changeMyPassword: (oldPw: string, newPw: string) => Promise<{ error?: string }>;
  refreshMe: () => Promise<void>;
  hasPermission: (perm: Permission) => boolean;
  canSeePrices: boolean;
  // Gestión de usuarios
  listUsers: () => Promise<AuthUser[]>;
  createUser: (input: {
    username: string;
    password: string;
    name: string;
    title: string;
    role: UserRole;
    permissions: Permission[];
  }) => Promise<{ error?: string }>;
  updateUser: (
    id: string,
    patch: { name?: string; title?: string; role?: UserRole; permissions?: Permission[]; active?: boolean },
  ) => Promise<{ error?: string }>;
  setUserPassword: (id: string, newPassword: string) => Promise<{ error?: string }>;
  // Bitácora
  logAudit: (input: AuditInput) => void;
  listAudit: () => Promise<AuditRow[]>;
  // Camionetas / flota
  listVehicles: () => Promise<Vehicle[]>;
  upsertVehicle: (v: {
    id?: string;
    patente: string;
    marca: string;
    modelo: string;
    anio: number | null;
    tipo: string;
    lastRevision: string | null;
    notes: string;
    active: boolean;
  }) => Promise<{ error?: string }>;
  deleteVehicle: (id: string) => Promise<{ error?: string }>;
}

export interface AuditRow {
  id: string;
  at: string;
  user_name: string;
  user_role: UserRole;
  action: string;
  entity: string;
  entity_id: string | null;
  entity_name: string | null;
  summary: string | null;
  changes: { field: string; before: string; after: string }[] | null;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthValue["status"]>("loading");
  const tokenRef = useRef<string | null>(null);

  const clearSession = useCallback(() => {
    tokenRef.current = null;
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* noop */
    }
    setUser(null);
    setStatus("anon");
  }, []);

  const refreshMe = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) {
      setStatus("anon");
      return;
    }
    const { data, error } = await supabase.rpc("me", { p_token: token });
    if (error || !data || (data as { error?: string }).error) {
      clearSession();
      return;
    }
    setUser((data as { user: AuthUser }).user);
    setStatus("authed");
  }, [clearSession]);

  // Restaurar sesión al montar.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let token: string | null = null;
    try {
      token = localStorage.getItem(TOKEN_KEY);
    } catch {
      /* noop */
    }
    tokenRef.current = token;
    if (token) {
      refreshMe();
    } else {
      setStatus("anon");
    }
  }, [refreshMe]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const login = useCallback<AuthValue["login"]>(async (username, password) => {
    const { data, error } = await supabase.rpc("login", {
      p_username: username,
      p_password: password,
    });
    if (error) return { error: "Error de conexión. Intenta nuevamente." };
    const res = data as { error?: string; token?: string; user?: AuthUser };
    if (res.error) return { error: res.error };
    tokenRef.current = res.token!;
    try {
      localStorage.setItem(TOKEN_KEY, res.token!);
    } catch {
      /* noop */
    }
    setUser(res.user!);
    setStatus("authed");
    return {};
  }, []);

  const logout = useCallback<AuthValue["logout"]>(async () => {
    const token = tokenRef.current;
    if (token) {
      try {
        await supabase.rpc("logout", { p_token: token });
      } catch {
        /* noop */
      }
    }
    clearSession();
  }, [clearSession]);

  const changeMyPassword = useCallback<AuthValue["changeMyPassword"]>(
    async (oldPw, newPw) => {
      const token = tokenRef.current;
      if (!token) return { error: "Sesión expirada" };
      const { data, error } = await supabase.rpc("change_my_password", {
        p_token: token,
        p_old: oldPw,
        p_new: newPw,
      });
      if (error) return { error: "Error de conexión" };
      const res = data as { error?: string };
      if (res.error) return { error: res.error };
      await refreshMe();
      return {};
    },
    [refreshMe],
  );

  const listUsers = useCallback<AuthValue["listUsers"]>(async () => {
    const token = tokenRef.current;
    if (!token) return [];
    const { data } = await supabase.rpc("list_users", { p_token: token });
    const res = data as { users?: AuthUser[]; error?: string };
    return res?.users ?? [];
  }, []);

  const createUser = useCallback<AuthValue["createUser"]>(async (input) => {
    const token = tokenRef.current;
    if (!token) return { error: "Sesión expirada" };
    const { data, error } = await supabase.rpc("create_user", {
      p_token: token,
      p_username: input.username,
      p_password: input.password,
      p_name: input.name,
      p_title: input.title,
      p_role: input.role,
      p_permissions: input.permissions,
    });
    if (error) return { error: "Error de conexión" };
    const res = data as { error?: string };
    return res.error ? { error: res.error } : {};
  }, []);

  const updateUser = useCallback<AuthValue["updateUser"]>(async (id, patch) => {
    const token = tokenRef.current;
    if (!token) return { error: "Sesión expirada" };
    const { data, error } = await supabase.rpc("update_user", {
      p_token: token,
      p_id: id,
      p_name: patch.name ?? null,
      p_title: patch.title ?? null,
      p_role: patch.role ?? null,
      p_permissions: patch.permissions ?? null,
      p_active: patch.active ?? null,
    });
    if (error) return { error: "Error de conexión" };
    const res = data as { error?: string };
    return res.error ? { error: res.error } : {};
  }, []);

  const setUserPassword = useCallback<AuthValue["setUserPassword"]>(
    async (id, newPassword) => {
      const token = tokenRef.current;
      if (!token) return { error: "Sesión expirada" };
      const { data, error } = await supabase.rpc("set_user_password", {
        p_token: token,
        p_id: id,
        p_new_password: newPassword,
      });
      if (error) return { error: "Error de conexión" };
      const res = data as { error?: string };
      return res.error ? { error: res.error } : {};
    },
    [],
  );

  const logAudit = useCallback<AuthValue["logAudit"]>((input) => {
    const token = tokenRef.current;
    if (!token) return;
    // Fire-and-forget: no bloquea la UI.
    supabase
      .rpc("log_audit", {
        p_token: token,
        p_action: input.action,
        p_entity: input.entity,
        p_entity_id: input.entityId ?? null,
        p_entity_name: input.entityName ?? null,
        p_summary: input.summary ?? null,
        p_changes: input.changes ?? null,
      })
      .then(() => {});
  }, []);

  const listAudit = useCallback<AuthValue["listAudit"]>(async () => {
    const token = tokenRef.current;
    if (!token) return [];
    const { data } = await supabase.rpc("list_audit", { p_token: token, p_limit: 500 });
    const res = data as { entries?: AuditRow[]; error?: string };
    return res?.entries ?? [];
  }, []);

  const listVehicles = useCallback<AuthValue["listVehicles"]>(async () => {
    const token = tokenRef.current;
    if (!token) return [];
    const { data } = await supabase.rpc("list_vehicles", { p_token: token });
    const res = data as { vehicles?: Vehicle[]; error?: string };
    return res?.vehicles ?? [];
  }, []);

  const upsertVehicle = useCallback<AuthValue["upsertVehicle"]>(async (v) => {
    const token = tokenRef.current;
    if (!token) return { error: "Sesión expirada" };
    const { data, error } = await supabase.rpc("upsert_vehicle", {
      p_token: token,
      p_id: v.id ?? null,
      p_patente: v.patente,
      p_marca: v.marca,
      p_modelo: v.modelo,
      p_anio: v.anio,
      p_tipo: v.tipo,
      p_last_revision: v.lastRevision,
      p_notes: v.notes,
      p_active: v.active,
    });
    if (error) return { error: "Error de conexión" };
    const res = data as { error?: string };
    return res.error ? { error: res.error } : {};
  }, []);

  const deleteVehicle = useCallback<AuthValue["deleteVehicle"]>(async (id) => {
    const token = tokenRef.current;
    if (!token) return { error: "Sesión expirada" };
    const { data, error } = await supabase.rpc("delete_vehicle", { p_token: token, p_id: id });
    if (error) return { error: "Error de conexión" };
    const res = data as { error?: string };
    return res.error ? { error: res.error } : {};
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      status,
      login,
      logout,
      changeMyPassword,
      refreshMe,
      hasPermission: (perm) => hasPerm(user, perm),
      canSeePrices: canSeePricesFn(user),
      listUsers,
      createUser,
      updateUser,
      setUserPassword,
      logAudit,
      listAudit,
      listVehicles,
      upsertVehicle,
      deleteVehicle,
    }),
    [user, status, login, logout, changeMyPassword, refreshMe, listUsers, createUser, updateUser, setUserPassword, logAudit, listAudit, listVehicles, upsertVehicle, deleteVehicle],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
