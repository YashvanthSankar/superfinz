export class FetchError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "FetchError";
  }
}

export async function apiFetch<T>(
  url: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  const { timeoutMs = 15_000, ...rest } = init ?? {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...rest, signal: controller.signal });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const message =
        typeof body?.error === "string" ? body.error : `Request failed (${res.status})`;
      throw new FetchError(res.status, message);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof FetchError) throw err;
    if ((err as { name?: string })?.name === "AbortError") {
      throw new FetchError(0, "Request timed out");
    }
    throw new FetchError(0, "Network error");
  } finally {
    clearTimeout(timer);
  }
}
