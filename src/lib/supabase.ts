import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para INSSUP.
 *
 * La URL y la llave publishable son públicas por diseño: TODO el acceso a datos
 * está protegido por RLS (bloqueo total de tablas) y funciones SECURITY DEFINER
 * que validan sesión y permisos en el servidor. Por eso pueden ir embebidas y la
 * app funciona sin configuración de entorno; se pueden sobreescribir por env.
 */
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://irvvqlxirmuoorkjhcis.supabase.co";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_QHr0nAZNwtbcQxZj_V0hWA_pVR5e_-B";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
