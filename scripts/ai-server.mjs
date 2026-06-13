import http from "node:http";

const port =
  Number(process.env.AI_SERVER_PORT ?? 8787);
const upstream =
  process.env.OLLAMA_UPSTREAM_URL ??
  "http://localhost:11434";
const apiKey =
  process.env.OLLAMA_API_KEY;

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json",
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on("data", (chunk) => {
      chunks.push(chunk);
    });

    req.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    req.on("error", reject);
  });
}

function isAuthorized(req) {
  if (!apiKey) return true;

  return (
    req.headers.authorization ===
    `Bearer ${apiKey}`
  );
}

const server = http.createServer(
  async (req, res) => {
    try {
      if (req.url === "/health") {
        sendJson(res, 200, {
          status: "ok",
          upstream,
          auth: apiKey ? "enabled" : "disabled",
        });
        return;
      }

      if (!isAuthorized(req)) {
        sendJson(res, 401, {
          error: "Unauthorized",
        });
        return;
      }

      if (
        !req.url?.startsWith("/api/generate") &&
        !req.url?.startsWith("/api/tags")
      ) {
        sendJson(res, 404, {
          error: "Not found",
        });
        return;
      }

      const body =
        req.method === "GET"
          ? undefined
          : await readBody(req);

      const upstreamResponse =
        await fetch(`${upstream}${req.url}`, {
          method: req.method,
          headers: {
            "Content-Type":
              req.headers["content-type"] ??
              "application/json",
          },
          body,
        });

      const responseBody =
        Buffer.from(
          await upstreamResponse.arrayBuffer()
        );

      res.writeHead(
        upstreamResponse.status,
        {
          "Content-Type":
            upstreamResponse.headers.get(
              "content-type"
            ) ?? "application/json",
        }
      );
      res.end(responseBody);
    } catch (error) {
      sendJson(res, 502, {
        error: "AI proxy error",
        message:
          error instanceof Error
            ? error.message
            : "Unknown error",
      });
    }
  }
);

server.listen(port, () => {
  console.log(
    `Atomix AI server listening on http://localhost:${port}`
  );
  console.log(`Forwarding Ollama to ${upstream}`);
  console.log(
    apiKey
      ? "Bearer auth enabled"
      : "Bearer auth disabled"
  );
});
