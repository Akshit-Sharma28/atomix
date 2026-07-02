import { requireAccess } from "@/services/users/access.service";

export const maxDuration = 20;

const allowedMethods = new Set([
  "initialize",
  "tools/list",
  "resources/list",
  "prompts/list",
  "ping",
]);

function isBlockedHost(hostname: string) {
  const normalized = hostname.toLowerCase();

  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "0.0.0.0" ||
    normalized.endsWith(".local") ||
    normalized === "169.254.169.254"
  );
}

function canProbeBlockedHostInDevelopment(hostname: string) {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  const normalized = hostname.toLowerCase();

  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "0.0.0.0" ||
    normalized.endsWith(".local")
  );
}

function parseHeaders(headersJson: unknown) {
  if (!headersJson || typeof headersJson !== "string") {
    return {};
  }

  const parsed = JSON.parse(headersJson) as Record<string, unknown>;

  return Object.fromEntries(
    Object.entries(parsed)
      .filter(([, value]) => typeof value === "string")
      .map(([key, value]) => [key, value as string]),
  );
}

export async function POST(req: Request) {
  try {
    await requireAccess([
      "ADMIN",
      "GOVERNANCE_TEAM",
      "VALIDATOR",
      "QA_REVIEWER",
      "REVIEWER",
    ]);

    const body = await req.json();
    const targetUrl = String(body.targetUrl ?? "").trim();
    const method = String(body.method ?? "tools/list").trim();
    const authHeaderName = String(body.authHeaderName ?? "").trim();
    const authHeaderValue = String(body.authHeaderValue ?? "").trim();
    const requestId = Number.isFinite(Number(body.requestId))
      ? Number(body.requestId)
      : Date.now();

    if (!targetUrl) {
      return Response.json({ ok: false, error: "MCP URL is required." }, { status: 400 });
    }

    if (!allowedMethods.has(method)) {
      return Response.json({ ok: false, error: "Unsupported MCP method." }, { status: 400 });
    }

    const url = new URL(targetUrl);

    if (!["https:", "http:"].includes(url.protocol)) {
      return Response.json({ ok: false, error: "Only HTTP/HTTPS MCP endpoints are supported." }, { status: 400 });
    }

    if (isBlockedHost(url.hostname) && !canProbeBlockedHostInDevelopment(url.hostname)) {
      return Response.json(
        {
          ok: false,
          error:
            "Blocked local/link-local host. Run MCP Inspector locally for localhost/STDIO testing, or use Atomix development mode for local HTTP probes.",
        },
        { status: 400 },
      );
    }

    const extraHeaders = parseHeaders(body.extraHeadersJson);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const startedAt = Date.now();
    const payload =
      method === "initialize"
        ? {
            jsonrpc: "2.0",
            id: requestId,
            method,
            params: {
              protocolVersion: "2025-06-18",
              capabilities: {},
              clientInfo: {
                name: "Atomix MCP Review Agent",
                version: "1.0.0",
              },
            },
          }
        : {
            jsonrpc: "2.0",
            id: requestId,
            method,
            params: {},
          };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        ...extraHeaders,
        ...(authHeaderName && authHeaderValue
          ? {
              [authHeaderName]: authHeaderValue,
            }
          : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));
    const elapsedMs = Date.now() - startedAt;
    const responseText = await response.text();

    let json: unknown = null;
    try {
      json = JSON.parse(responseText);
    } catch {
      json = null;
    }

    return Response.json({
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      elapsedMs,
      method,
      request: payload,
      response: json ?? responseText.slice(0, 12000),
      contentType: response.headers.get("content-type") ?? "unknown",
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "MCP inspector request failed.",
      },
      { status: 400 },
    );
  }
}
