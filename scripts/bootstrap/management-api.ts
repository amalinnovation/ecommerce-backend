/**
 * Cliente mínimo de la Management API de Supabase, compartido por los
 * scripts de arranque. Requiere SUPABASE_ACCESS_TOKEN (token personal,
 * no la anon/service key) y SUPABASE_PROJECT_REF.
 *
 * Estos scripts sólo se ejecutan cuando alguien los invoca a propósito
 * con esas credenciales — nunca como parte de `pnpm install` o del CI.
 */

const API_BASE = 'https://api.supabase.com/v1';

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Los scripts de arranque necesitan credenciales explícitas — no se infieren.`,
    );
  }
  return value;
}

export async function managementRequest<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const accessToken = requireEnv('SUPABASE_ACCESS_TOKEN');
  const res = await fetch(`${API_BASE}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Management API ${init.method ?? 'GET'} ${path} -> ${res.status}: ${text}`);
  }

  return (await res.json()) as T;
}
