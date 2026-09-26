import { useEffect, useState } from 'react';

export type CompanionHealth = {
  status: 'ok' | 'degraded' | 'unreachable';
  configured: boolean;
  phone: boolean;
};

const UNREACHABLE: CompanionHealth = { status: 'unreachable', configured: false, phone: false };

function isHealth(value: unknown): value is Omit<CompanionHealth, 'status'> & { status: 'ok' | 'degraded' } {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (v.status === 'ok' || v.status === 'degraded') && typeof v.configured === 'boolean';
}

/** Probes the worker once so the UI can show only the modes that actually work. */
export function useCompanionHealth(apiUrl: string): CompanionHealth | null {
  const [health, setHealth] = useState<CompanionHealth | null>(apiUrl ? null : UNREACHABLE);

  useEffect(() => {
    if (!apiUrl) return;
    const controller = new AbortController();
    fetch(`${apiUrl}/health`, { signal: controller.signal })
      .then(async (res) => {
        const body: unknown = await res.json().catch(() => null);
        if (!isHealth(body)) return UNREACHABLE;
        return { status: body.status, configured: body.configured, phone: Boolean(body.phone) };
      })
      .catch(() => UNREACHABLE)
      .then((value) => {
        if (!controller.signal.aborted) setHealth(value);
      });
    return () => controller.abort();
  }, [apiUrl]);

  return health;
}
