# Atomix MCP Server

Atomix exposes a read-only Streamable HTTP MCP endpoint at:

```text
/api/mcp
```

Use this for assistants that need governed Atomix context: projects, reviews,
findings, dashboard counts, and the MCP security control library.

## Recommendation

Start with read-only MCP access. Atomix already has authenticated web workflows
for creating and changing records, so MCP write tools should wait until each
action has explicit authorization, confirmation, and audit events.

## Production Setup

Set these environment variables on the production deployment:

```bash
ATOMIX_MCP_TOKEN="replace-with-a-long-random-token"
ATOMIX_MCP_ALLOWED_ORIGINS="https://atomix.solutions,https://www.atomix.solutions"
ATOMIX_MCP_RATE_LIMIT_PER_MINUTE="60"
```

Generate a strong token locally:

```bash
openssl rand -base64 48
```

`ATOMIX_MCP_TOKEN` is required in production. `ATOMIX_MCP_ALLOWED_ORIGINS`
controls browser-based callers such as the Atomix Inspector UI. Server-to-server
MCP clients do not need CORS, but they still need the bearer token.

## Authentication

MCP clients can authenticate with either header:

```text
Authorization: Bearer replace-with-a-long-random-token
```

```text
X-Atomix-MCP-Token: replace-with-a-long-random-token
```

In development, if `ATOMIX_MCP_TOKEN` is not set, the endpoint is open so MCP
Inspector can test it quickly. In production, the endpoint refuses requests
until the token is configured.

## Production Endpoint

Use the deployed HTTPS endpoint:

```text
https://atomix.solutions/api/mcp
```

Recommended production probe:

```bash
curl -sS https://atomix.solutions/api/mcp \
  -H "content-type: application/json" \
  -H "authorization: Bearer $ATOMIX_MCP_TOKEN" \
  --data '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

The endpoint is read-only, returns `Cache-Control: no-store`, requires a token in
production, limits request body size, and rate-limits callers by IP/token.

## MCP Inspector

For the Atomix in-app MCP Inspector Lite:

```text
MCP Endpoint URL: https://atomix.solutions/api/mcp
JSON-RPC Method: initialize, tools/list, resources/list, prompts/list, or ping
Auth Header Name: Authorization
Auth Header Value: Bearer replace-with-a-long-random-token
```

For local development, use `http://localhost:3001/api/mcp` or whichever port
`next dev` is running on.

For MCP Inspector desktop or CLI, point it at the same Streamable HTTP URL.

## Tools

- `atomix.dashboard_summary`: governance counts across projects, reviews, findings, and MCP controls.
- `atomix.search_projects`: search projects by name, client, SPR ID, status, or risk tier.
- `atomix.get_project`: fetch a project by ID or SPR ID with reviews and recent findings.
- `atomix.list_reviews`: list security reviews with optional filters.
- `atomix.get_review`: fetch a review by ID or SR ID with assignments, workstreams, findings, and activities.
- `atomix.list_findings`: list findings with optional project, review, severity, status, or text filters.
- `atomix.get_mcp_controls`: return MCP security review controls, optionally filtered by transport.

## Resources

- `atomix://dashboard/summary`
- `atomix://mcp/controls`

## Prompt

- `atomix_security_review_brief`
