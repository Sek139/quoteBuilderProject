const APEX_BASE = '/services/apexrest/ZuoraProxy';

export async function zuoraGet<T>(path: string): Promise<T> {
  const res = await fetch(`${APEX_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Zuora GET ${path} failed (${res.status}): ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export async function zuoraPost<TBody, TResult>(path: string, body: TBody): Promise<TResult> {
  const res = await fetch(`${APEX_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Zuora POST ${path} failed (${res.status}): ${await res.text()}`);
  }
  return res.json() as Promise<TResult>;
}
