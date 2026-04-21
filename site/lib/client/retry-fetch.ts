export class NetworkRequestError extends Error {
  constructor(message = "Connection issue — check your network and try again") {
    super(message);
    this.name = "NetworkRequestError";
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const delays = [1000, 2000, 4000];
  let lastError: unknown;

  for (let attempt = 0; attempt < delays.length; attempt += 1) {
    try {
      const response = await fetch(input, init);
      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        if (response.status >= 500) {
          throw new NetworkRequestError();
        }

        return payload as T;
      }

      return payload as T;
    } catch (error) {
      lastError = error;
      if (attempt < delays.length - 1) {
        await wait(delays[attempt]);
        continue;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new NetworkRequestError();
}
