const API_PREFIX = (import.meta as any).env?.VITE_API_URL || "/api";

async function parseJsonResponse(res: Response) {
  const text = await res.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Invalid JSON response: ${text}`);
    }
  }
  if (!res.ok) {
    throw new Error(data?.detail || data?.error || res.statusText || `Request failed with status ${res.status}`);
  }
  return data;
}

export async function createFriendExpense(payload: any) {
  const url = `${API_PREFIX}/friendsplit/create`;
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return parseJsonResponse(res);
}

export async function getFriendHistory() {
  const url = `${API_PREFIX}/friendsplit/history`;
  const res = await fetch(url, { credentials: 'include' });
  return parseJsonResponse(res);
}

export async function getFriendAnalytics() {
  const url = `${API_PREFIX}/friendsplit/analytics`;
  const res = await fetch(url, { credentials: 'include' });
  return parseJsonResponse(res);
}

export async function settleFriendSettlement(id: string) {
  const url = `${API_PREFIX}/friendsplit/settle/${id}`;
  const res = await fetch(url, { method: 'PUT', credentials: 'include' });
  return parseJsonResponse(res);
}
