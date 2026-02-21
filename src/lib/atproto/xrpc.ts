import type { OAuthSession } from "@atproto/oauth-client-node";

interface XrpcError extends Error {
  status?: number;
  error?: string;
}

function createXrpcError(
  message: string,
  options?: { status?: number; error?: string },
): XrpcError {
  const err = new Error(message) as XrpcError;
  err.status = options?.status;
  err.error = options?.error;
  return err;
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw createXrpcError("AT response is not valid JSON", {
      status: response.status,
    });
  }
}

async function xrpcRequest<T>(
  session: OAuthSession,
  nsid: string,
  init: RequestInit,
): Promise<T> {
  const response = await session.fetchHandler(`/xrpc/${nsid}`, init);
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    const errObj =
      typeof data === "object" && data !== null
        ? (data as { error?: string; message?: string })
        : undefined;

    throw createXrpcError(
      errObj?.message ?? `AT request failed: ${response.status}`,
      {
        status: response.status,
        error: errObj?.error,
      },
    );
  }

  return data as T;
}

function withQuery(path: string, query: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }

  const suffix = params.toString();
  return suffix ? `${path}?${suffix}` : path;
}

export async function createRecord<TRecord>(
  session: OAuthSession,
  collection: string,
  record: TRecord,
): Promise<{ uri: string; cid: string }> {
  return xrpcRequest<{ uri: string; cid: string }>(
    session,
    "com.atproto.repo.createRecord",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        repo: session.did,
        collection,
        record,
      }),
    },
  );
}

export async function putRecord<TRecord>(
  session: OAuthSession,
  collection: string,
  rkey: string,
  record: TRecord,
): Promise<{ uri: string; cid: string }> {
  return xrpcRequest<{ uri: string; cid: string }>(
    session,
    "com.atproto.repo.putRecord",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        repo: session.did,
        collection,
        rkey,
        record,
      }),
    },
  );
}

export async function deleteRecord(
  session: OAuthSession,
  collection: string,
  rkey: string,
): Promise<void> {
  await xrpcRequest(
    session,
    "com.atproto.repo.deleteRecord",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        repo: session.did,
        collection,
        rkey,
      }),
    },
  );
}

export async function getRecord(
  session: OAuthSession,
  collection: string,
  repo: string,
  rkey: string,
): Promise<{ uri: string; cid: string; value: unknown }> {
  const path = withQuery("/xrpc/com.atproto.repo.getRecord", {
    collection,
    repo,
    rkey,
  });

  const response = await session.fetchHandler(path, { method: "GET" });
  const data = (await parseJsonResponse(response)) as {
    uri: string;
    cid: string;
    value: unknown;
    message?: string;
  };

  if (!response.ok) {
    throw createXrpcError(data.message ?? "Failed to get record", {
      status: response.status,
    });
  }

  return { uri: data.uri, cid: data.cid, value: data.value };
}

export async function listRecords(
  session: OAuthSession,
  collection: string,
  repo: string,
  limit = 50,
): Promise<Array<{ uri: string; cid: string; value: unknown }>> {
  const path = withQuery("/xrpc/com.atproto.repo.listRecords", {
    collection,
    repo,
    limit: String(limit),
  });

  const response = await session.fetchHandler(path, { method: "GET" });
  const data = (await parseJsonResponse(response)) as {
    records?: Array<{ uri: string; cid: string; value: unknown }>;
    message?: string;
  };

  if (!response.ok) {
    throw createXrpcError(data.message ?? "Failed to list records", {
      status: response.status,
    });
  }

  return data.records ?? [];
}

export async function uploadBlob(
  session: OAuthSession,
  file: File,
): Promise<unknown> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const response = await session.fetchHandler("/xrpc/com.atproto.repo.uploadBlob", {
    method: "POST",
    headers: {
      "content-type": file.type || "application/octet-stream",
    },
    body: bytes,
  });

  const data = (await parseJsonResponse(response)) as {
    blob?: unknown;
    message?: string;
  };

  if (!response.ok || !data.blob) {
    throw createXrpcError(data.message ?? "Failed to upload blob", {
      status: response.status,
    });
  }

  return data.blob;
}

export async function describeRepo(
  session: OAuthSession,
  did: string,
): Promise<{ handle?: string }> {
  const path = withQuery("/xrpc/com.atproto.repo.describeRepo", {
    repo: did,
  });

  const response = await session.fetchHandler(path, { method: "GET" });
  const data = (await parseJsonResponse(response)) as {
    handle?: string;
    message?: string;
  };

  if (!response.ok) {
    throw createXrpcError(data.message ?? "Failed to describe repo", {
      status: response.status,
    });
  }

  return { handle: data.handle };
}
