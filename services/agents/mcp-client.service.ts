type JsonRpcId = string | number | null;

type JsonRpcResponse<T> = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result?: T;
  error?: {
    code: number;
    message: string;
  };
};

export type McpToolCallResult = {
  toolName: string;
  arguments: Record<string, unknown>;
  elapsedMs: number;
  resultText: string;
};

function mcpEndpoint() {
  if (process.env.ATOMIX_MCP_INTERNAL_URL) {
    return process.env.ATOMIX_MCP_INTERNAL_URL;
  }

  if (process.env.NEXTAUTH_URL) {
    return `${process.env.NEXTAUTH_URL.replace(/\/$/, "")}/api/mcp`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/mcp`;
  }

  return "http://localhost:3000/api/mcp";
}

function authHeaders(): Record<string, string> {
  const token = process.env.ATOMIX_MCP_TOKEN;

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

function extractText(result: unknown) {
  if (!result || typeof result !== "object") {
    return JSON.stringify(result, null, 2);
  }

  const content = (result as { content?: unknown }).content;

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (!item || typeof item !== "object") {
          return "";
        }

        const text = (item as { text?: unknown }).text;

        return typeof text === "string" ? text : "";
      })
      .filter(Boolean)
      .join("\n\n");
  }

  return JSON.stringify(result, null, 2);
}

export async function callMcpTool(
  toolName: string,
  toolArguments: Record<string, unknown> = {},
): Promise<McpToolCallResult> {
  const startedAt = Date.now();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...authHeaders(),
  };
  const response = await fetch(mcpEndpoint(), {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: toolName,
        arguments: toolArguments,
      },
    }),
  });
  const elapsedMs = Date.now() - startedAt;
  const payload = (await response.json()) as JsonRpcResponse<unknown>;

  if (!response.ok || payload.error) {
    throw new Error(
      payload.error?.message ??
        `MCP tool call failed with HTTP ${response.status}.`,
    );
  }

  return {
    toolName,
    arguments: toolArguments,
    elapsedMs,
    resultText: extractText(payload.result),
  };
}
