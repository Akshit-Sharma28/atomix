import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { mcpControls, type McpTransport } from "@/lib/mcp-controls";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

type JsonRpcId = string | number | null;

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: JsonRpcId;
  method?: string;
  params?: unknown;
};

type ToolDefinition = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

const serverInfo = {
  name: "atomix-mcp",
  version: "0.1.0",
};

const protocolVersion = "2025-06-18";
const maxRequestBytes = 100_000;
const rateLimitWindowMs = 60_000;

const globalForMcp = globalThis as unknown as {
  atomixMcpRateLimits?: Map<string, { count: number; resetAt: number }>;
};

const rateLimits =
  globalForMcp.atomixMcpRateLimits ??
  new Map<string, { count: number; resetAt: number }>();

if (process.env.NODE_ENV !== "production") {
  globalForMcp.atomixMcpRateLimits = rateLimits;
}

const tools: ToolDefinition[] = [
  {
    name: "atomix.dashboard_summary",
    title: "Dashboard summary",
    description:
      "Return high-level Atomix governance counts for projects, reviews, findings, and open risk.",
    inputSchema: objectSchema({}),
  },
  {
    name: "atomix.search_projects",
    title: "Search projects",
    description:
      "Search Atomix projects by name, client, SPR ID, status, or risk tier.",
    inputSchema: objectSchema({
      query: stringSchema("Optional search text."),
      limit: numberSchema("Maximum projects to return. Default 10, max 25."),
    }),
  },
  {
    name: "atomix.get_project",
    title: "Get project",
    description:
      "Return a project by project ID or SPR ID, including reviews and recent findings.",
    inputSchema: objectSchema({
      idOrSpr: requiredStringSchema("Project ID or SPR ID."),
    }, ["idOrSpr"]),
  },
  {
    name: "atomix.list_reviews",
    title: "List reviews",
    description:
      "List security reviews with optional project, status, type, or text filters.",
    inputSchema: objectSchema({
      projectId: stringSchema("Optional project ID."),
      status: stringSchema("Optional review status."),
      type: stringSchema("Optional review type."),
      query: stringSchema("Optional search text."),
      limit: numberSchema("Maximum reviews to return. Default 10, max 25."),
    }),
  },
  {
    name: "atomix.get_review",
    title: "Get review",
    description:
      "Return a security review by review ID or SR ID, including assignments, workstreams, and findings.",
    inputSchema: objectSchema({
      idOrSr: requiredStringSchema("Review ID or SR ID."),
    }, ["idOrSr"]),
  },
  {
    name: "atomix.list_findings",
    title: "List findings",
    description:
      "List findings with optional project, review, severity, status, or text filters.",
    inputSchema: objectSchema({
      projectId: stringSchema("Optional project ID."),
      reviewId: stringSchema("Optional review ID."),
      severity: stringSchema("Optional severity."),
      status: stringSchema("Optional finding status."),
      query: stringSchema("Optional search text."),
      limit: numberSchema("Maximum findings to return. Default 10, max 25."),
    }),
  },
  {
    name: "atomix.get_mcp_controls",
    title: "Get MCP controls",
    description:
      "Return Atomix MCP security review controls, optionally filtered by transport.",
    inputSchema: objectSchema({
      transport: stringSchema("STDIO, Streamable HTTP, or Both / Hybrid."),
    }),
  },
];

export async function OPTIONS(req: NextRequest) {
  const originError = validateOrigin(req);

  if (originError) {
    return originError;
  }

  return new Response(null, {
    status: 204,
    headers: responseHeaders(req),
  });
}

export async function GET(req: NextRequest) {
  const originError = validateOrigin(req);

  if (originError) {
    return originError;
  }

  const rateLimitError = rateLimit(req);

  if (rateLimitError) {
    return rateLimitError;
  }

  const authError = authorize(req);

  if (authError) {
    return authError;
  }

  return NextResponse.json(
    {
      ok: true,
      serverInfo,
      endpoint: "/api/mcp",
      transport: "Streamable HTTP",
      protocolVersion,
      tools: tools.map((tool) => tool.name),
    },
    {
      headers: responseHeaders(req),
    },
  );
}

export async function POST(req: NextRequest) {
  const originError = validateOrigin(req);

  if (originError) {
    return originError;
  }

  const rateLimitError = rateLimit(req);

  if (rateLimitError) {
    return rateLimitError;
  }

  const authError = authorize(req);

  if (authError) {
    return authError;
  }

  try {
    const body = await parseJsonBody(req);
    const requests = Array.isArray(body) ? body : [body];
    const responses = (
      await Promise.all(requests.map((request) => handleRequest(request)))
    ).filter(Boolean);

    if (responses.length === 0) {
      return new Response(null, {
        status: 204,
        headers: responseHeaders(req),
      });
    }

    return NextResponse.json(Array.isArray(body) ? responses : responses[0], {
      headers: responseHeaders(req),
    });
  } catch (error) {
    return NextResponse.json(
      jsonRpcError(null, -32700, errorMessage(error, "Parse error")),
      {
        status: 400,
        headers: responseHeaders(req),
      },
    );
  }
}

async function handleRequest(rawRequest: unknown) {
  const request = rawRequest as JsonRpcRequest;
  const id = request.id ?? null;

  if (!request || request.jsonrpc !== "2.0" || typeof request.method !== "string") {
    return jsonRpcError(id, -32600, "Invalid JSON-RPC request.");
  }

  if (request.id === undefined) {
    return null;
  }

  try {
    switch (request.method) {
      case "initialize":
        return jsonRpcResult(id, {
          protocolVersion,
          capabilities: {
            tools: {},
            resources: {},
            prompts: {},
          },
          serverInfo,
        });
      case "ping":
        return jsonRpcResult(id, {});
      case "tools/list":
        return jsonRpcResult(id, { tools });
      case "tools/call":
        return jsonRpcResult(id, await callTool(request.params));
      case "resources/list":
        return jsonRpcResult(id, {
          resources: [
            {
              uri: "atomix://dashboard/summary",
              name: "Atomix dashboard summary",
              description:
                "Live governance counts for projects, reviews, findings, and risk.",
              mimeType: "application/json",
            },
            {
              uri: "atomix://mcp/controls",
              name: "Atomix MCP control library",
              description:
                "MCP security review controls used by the Atomix MCP Review Agent.",
              mimeType: "application/json",
            },
          ],
        });
      case "resources/read":
        return jsonRpcResult(id, await readResource(request.params));
      case "prompts/list":
        return jsonRpcResult(id, {
          prompts: [
            {
              name: "atomix_security_review_brief",
              title: "Atomix security review brief",
              description:
                "Create a concise reviewer brief from Atomix project, review, finding, and control context.",
              arguments: [
                {
                  name: "focus",
                  description:
                    "Optional focus area such as overdue reviews, critical findings, or MCP controls.",
                  required: false,
                },
              ],
            },
          ],
        });
      case "prompts/get":
        return jsonRpcResult(id, getPrompt(request.params));
      default:
        return jsonRpcError(id, -32601, `Unsupported MCP method: ${request.method}`);
    }
  } catch (error) {
    return jsonRpcError(id, -32603, errorMessage(error, "MCP request failed."));
  }
}

async function callTool(params: unknown) {
  const { name, arguments: toolArguments } = paramsObject(params);

  if (typeof name !== "string") {
    throw new Error("Tool name is required.");
  }

  const args = recordFromUnknown(toolArguments);

  switch (name) {
    case "atomix.dashboard_summary":
      return textResult(await getDashboardSummary());
    case "atomix.search_projects":
      return textResult(await searchProjects(args));
    case "atomix.get_project":
      return textResult(await getProject(args));
    case "atomix.list_reviews":
      return textResult(await listReviews(args));
    case "atomix.get_review":
      return textResult(await getReview(args));
    case "atomix.list_findings":
      return textResult(await listFindings(args));
    case "atomix.get_mcp_controls":
      return textResult(getMcpControls(args));
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function readResource(params: unknown) {
  const { uri } = paramsObject(params);

  if (uri === "atomix://dashboard/summary") {
    return resourceText(uri, await getDashboardSummary());
  }

  if (uri === "atomix://mcp/controls") {
    return resourceText(uri, { controls: mcpControls });
  }

  throw new Error("Unknown resource URI.");
}

function getPrompt(params: unknown) {
  const { name, arguments: promptArguments } = paramsObject(params);

  if (name !== "atomix_security_review_brief") {
    throw new Error("Unknown prompt.");
  }

  const args = recordFromUnknown(promptArguments);
  const focus = stringArg(args, "focus") ?? "current Atomix security review context";

  return {
    description: "Create a concise Atomix reviewer brief.",
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text:
            `Using Atomix MCP tools and resources, prepare a concise security review brief focused on ${focus}. ` +
            "Include relevant projects, reviews, findings, MCP controls, assumptions, and reviewer next actions.",
        },
      },
    ],
  };
}

async function getDashboardSummary() {
  const [
    projectCount,
    reviewCount,
    activeReviewCount,
    overdueReviewCount,
    findingCount,
    openFindingCount,
    criticalOpenCount,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.securityReview.count(),
    prisma.securityReview.count({
      where: {
        status: {
          notIn: ["Completed", "Closed", "Cancelled"],
        },
      },
    }),
    prisma.securityReview.count({
      where: {
        dueDate: {
          lt: new Date(),
        },
        status: {
          notIn: ["Completed", "Closed", "Cancelled"],
        },
      },
    }),
    prisma.finding.count(),
    prisma.finding.count({
      where: {
        status: {
          not: "Closed",
        },
      },
    }),
    prisma.finding.count({
      where: {
        severity: "Critical",
        status: {
          not: "Closed",
        },
      },
    }),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    projectCount,
    reviewCount,
    activeReviewCount,
    overdueReviewCount,
    findingCount,
    openFindingCount,
    criticalOpenCount,
    mcpControlCount: mcpControls.length,
  };
}

async function searchProjects(args: Record<string, unknown>) {
  const query = stringArg(args, "query");
  const limit = limitArg(args);

  return prisma.project.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query } },
            { client: { contains: query } },
            { sprId: { contains: query } },
            { status: { contains: query } },
            { riskTier: { contains: query } },
          ],
        }
      : undefined,
    select: {
      id: true,
      sprId: true,
      name: true,
      client: true,
      status: true,
      riskTier: true,
      updatedAt: true,
      _count: {
        select: {
          reviews: true,
          findings: true,
          tasks: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: limit,
  });
}

async function getProject(args: Record<string, unknown>) {
  const idOrSpr = requiredStringArg(args, "idOrSpr");

  const project = await prisma.project.findFirst({
    where: {
      OR: [{ id: idOrSpr }, { sprId: idOrSpr }],
    },
    include: {
      projectManager: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      validator: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      reviews: {
        orderBy: {
          updatedAt: "desc",
        },
        take: 10,
        include: {
          assignments: true,
          workstreams: true,
        },
      },
      findings: {
        orderBy: {
          updatedAt: "desc",
        },
        take: 10,
      },
      _count: {
        select: {
          components: true,
          scopeProfiles: true,
          tasks: true,
        },
      },
    },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  return project;
}

async function listReviews(args: Record<string, unknown>) {
  const query = stringArg(args, "query");
  const projectId = stringArg(args, "projectId");
  const status = stringArg(args, "status");
  const type = stringArg(args, "type");
  const limit = limitArg(args);

  return prisma.securityReview.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query } },
              { srId: { contains: query } },
              { project: { name: { contains: query } } },
              { project: { sprId: { contains: query } } },
            ],
          }
        : {}),
    },
    include: {
      project: {
        select: {
          id: true,
          sprId: true,
          name: true,
          client: true,
        },
      },
      assignments: true,
      workstreams: true,
      _count: {
        select: {
          findings: true,
          extensions: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: limit,
  });
}

async function getReview(args: Record<string, unknown>) {
  const idOrSr = requiredStringArg(args, "idOrSr");

  const review = await prisma.securityReview.findFirst({
    where: {
      OR: [{ id: idOrSr }, { srId: idOrSr }],
    },
    include: {
      project: true,
      scopeProfile: true,
      assignments: {
        include: {
          reviewerProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
              skills: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
      workstreams: true,
      findings: {
        orderBy: {
          updatedAt: "desc",
        },
        take: 25,
      },
      extensions: true,
      cancellation: true,
      activities: {
        orderBy: {
          createdAt: "desc",
        },
        take: 25,
      },
    },
  });

  if (!review) {
    throw new Error("Review not found.");
  }

  return review;
}

async function listFindings(args: Record<string, unknown>) {
  const query = stringArg(args, "query");
  const projectId = stringArg(args, "projectId");
  const reviewId = stringArg(args, "reviewId");
  const severity = stringArg(args, "severity");
  const status = stringArg(args, "status");
  const limit = limitArg(args);

  return prisma.finding.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      ...(reviewId ? { reviewId } : {}),
      ...(severity ? { severity } : {}),
      ...(status ? { status } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query } },
              { source: { contains: query } },
              { description: { contains: query } },
              { remediation: { contains: query } },
              { project: { name: { contains: query } } },
              { review: { title: { contains: query } } },
              { review: { srId: { contains: query } } },
            ],
          }
        : {}),
    },
    include: {
      project: {
        select: {
          id: true,
          sprId: true,
          name: true,
          client: true,
        },
      },
      review: {
        select: {
          id: true,
          srId: true,
          title: true,
          status: true,
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: limit,
  });
}

function getMcpControls(args: Record<string, unknown>) {
  const transport = stringArg(args, "transport") as McpTransport | undefined;
  const controls = transport
    ? mcpControls.filter((control) => control.appliesTo.includes(transport))
    : mcpControls;

  return {
    transport: transport ?? "all",
    count: controls.length,
    controls,
  };
}

function authorize(req: NextRequest) {
  const expectedToken = process.env.ATOMIX_MCP_TOKEN;

  if (!expectedToken) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          error:
            "ATOMIX_MCP_TOKEN is required before exposing the Atomix MCP endpoint in production.",
        },
        {
          status: 503,
          headers: responseHeaders(req),
        },
      );
    }

    return null;
  }

  const authorization = req.headers.get("authorization") ?? "";
  const bearerToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  const headerToken = req.headers.get("x-atomix-mcp-token");
  const providedToken = bearerToken ?? headerToken;

  if (!providedToken || !safeTokenEqual(providedToken, expectedToken)) {
    return NextResponse.json(
      {
        error: "Unauthorized MCP request.",
      },
      {
        status: 401,
        headers: {
          ...responseHeaders(req),
          "WWW-Authenticate": "Bearer",
        },
      },
    );
  }

  return null;
}

async function parseJsonBody(req: NextRequest) {
  const contentLength = Number(req.headers.get("content-length") ?? 0);

  if (contentLength > maxRequestBytes) {
    throw new Error("MCP request body is too large.");
  }

  const text = await req.text();

  if (text.length > maxRequestBytes) {
    throw new Error("MCP request body is too large.");
  }

  return JSON.parse(text);
}

function validateOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");

  if (!origin || isAllowedOrigin(origin)) {
    return null;
  }

  return NextResponse.json(
    {
      error: "Origin is not allowed for Atomix MCP.",
    },
    {
      status: 403,
      headers: responseHeaders(req),
    },
  );
}

function isAllowedOrigin(origin: string) {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  return configuredAllowedOrigins().includes(origin);
}

function configuredAllowedOrigins() {
  const origins = new Set<string>();
  const configured = process.env.ATOMIX_MCP_ALLOWED_ORIGINS ?? "";

  for (const origin of configured.split(",")) {
    addOrigin(origins, origin);
  }

  addOrigin(origins, process.env.NEXTAUTH_URL);
  addOrigin(
    origins,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  );

  return [...origins];
}

function addOrigin(origins: Set<string>, value?: string) {
  if (!value) {
    return;
  }

  try {
    origins.add(new URL(value.trim()).origin);
  } catch {
    return;
  }
}

function rateLimit(req: NextRequest) {
  const limit = rateLimitPerMinute();
  const key = rateLimitKey(req);
  const now = Date.now();
  const current = rateLimits.get(key);

  if (!current || current.resetAt <= now) {
    rateLimits.set(key, {
      count: 1,
      resetAt: now + rateLimitWindowMs,
    });
    return null;
  }

  current.count += 1;

  if (current.count <= limit) {
    return null;
  }

  return NextResponse.json(
    {
      error: "Atomix MCP rate limit exceeded.",
    },
    {
      status: 429,
      headers: {
        ...responseHeaders(req),
        "Retry-After": String(Math.ceil((current.resetAt - now) / 1000)),
      },
    },
  );
}

function rateLimitPerMinute() {
  const configured = Number(process.env.ATOMIX_MCP_RATE_LIMIT_PER_MINUTE);

  if (Number.isFinite(configured) && configured > 0) {
    return Math.trunc(configured);
  }

  return process.env.NODE_ENV === "production" ? 60 : 300;
}

function rateLimitKey(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  const token =
    req.headers.get("authorization") ??
    req.headers.get("x-atomix-mcp-token") ??
    "anonymous";

  return `${forwardedFor ?? realIp ?? "unknown"}:${token.slice(-12)}`;
}

function safeTokenEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function jsonRpcResult(id: JsonRpcId, result: unknown) {
  return {
    jsonrpc: "2.0",
    id,
    result,
  };
}

function jsonRpcError(id: JsonRpcId, code: number, message: string) {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
    },
  };
}

function textResult(value: unknown) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

function resourceText(uri: unknown, value: unknown) {
  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

function objectSchema(
  properties: Record<string, unknown>,
  required: string[] = [],
) {
  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
}

function stringSchema(description: string) {
  return {
    type: "string",
    description,
  };
}

function requiredStringSchema(description: string) {
  return stringSchema(description);
}

function numberSchema(description: string) {
  return {
    type: "number",
    description,
  };
}

function paramsObject(params: unknown) {
  return recordFromUnknown(params);
}

function recordFromUnknown(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function stringArg(args: Record<string, unknown>, key: string) {
  const value = args[key];

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function requiredStringArg(args: Record<string, unknown>, key: string) {
  const value = stringArg(args, key);

  if (!value) {
    throw new Error(`${key} is required.`);
  }

  return value;
}

function limitArg(args: Record<string, unknown>) {
  const rawLimit = args.limit;
  const parsedLimit =
    typeof rawLimit === "number"
      ? rawLimit
      : typeof rawLimit === "string"
        ? Number(rawLimit)
        : 10;

  if (!Number.isFinite(parsedLimit)) {
    return 10;
  }

  return Math.max(1, Math.min(Math.trunc(parsedLimit), 25));
}

function responseHeaders(req: NextRequest) {
  return {
    ...corsHeaders(req),
    "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  };
}

function corsHeaders(req: NextRequest) {
  const origin = req.headers.get("origin");
  const allowedOrigin =
    origin && isAllowedOrigin(origin)
      ? origin
      : process.env.NODE_ENV === "production"
        ? undefined
        : "*";

  return {
    ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "content-type, authorization, x-atomix-mcp-token, mcp-session-id, mcp-protocol-version",
    "Access-Control-Expose-Headers": "mcp-session-id",
    ...(allowedOrigin && allowedOrigin !== "*" ? { Vary: "Origin" } : {}),
  };
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
