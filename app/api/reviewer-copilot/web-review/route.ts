import dns from "node:dns/promises";
import net from "node:net";
import tls from "node:tls";

export const runtime = "nodejs";

type Finding = {
  check: string;
  severity: "critical" | "high" | "medium" | "low" | "info" | "pass";
  status: "pass" | "review" | "fail" | "info";
  evidence: string;
  recommendation: string;
  control: string;
  pointsLost: number;
};

const riskyParameterNames = [
  "url",
  "uri",
  "target",
  "dest",
  "destination",
  "redirect",
  "redirect_uri",
  "return",
  "returnurl",
  "callback",
  "continue",
  "next",
  "webhook",
  "feed",
  "proxy",
  "image",
  "file",
  "path",
];

function isPrivateIp(address: string) {
  if (net.isIPv6(address)) {
    const normalized = address.toLowerCase();
    return (
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:") ||
      normalized === "::"
    );
  }

  const parts = address.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return true;
  }

  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

async function assertPublicTarget(target: URL) {
  if (!["http:", "https:"].includes(target.protocol)) {
    throw new Error("Only http and https targets are supported.");
  }

  if (!target.hostname || target.hostname === "localhost") {
    throw new Error("Localhost and private targets are blocked.");
  }

  const addresses = await dns.lookup(target.hostname, {
    all: true,
    verbatim: false,
  });

  if (addresses.some((entry) => isPrivateIp(entry.address))) {
    throw new Error("Private, loopback, link-local, and internal targets are blocked.");
  }
}

function getHeader(headers: Headers, name: string) {
  return headers.get(name) ?? "";
}

function grade(score: number) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function collectComments(html: string) {
  return Array.from(html.matchAll(/<!--([\s\S]*?)-->/g))
    .map((match) => match[1].replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 5);
}

function collectScripts(html: string) {
  return Array.from(html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi))
    .map((match) => match[1])
    .slice(0, 20);
}

function collectForms(html: string) {
  const forms = Array.from(html.matchAll(/<form[\s\S]*?<\/form>/gi)).map(
    (match) => match[0]
  );

  return forms.map((form) => ({
    hasPassword: /type=["']password["']/i.test(form),
    hasCsrf:
      /csrf|xsrf|authenticity_token|requestverificationtoken|anti-forgery/i.test(
        form
      ),
    hasAutocompleteOff: /autocomplete=["']off["']/i.test(form),
    method: form.match(/method=["']([^"']+)["']/i)?.[1]?.toUpperCase() ?? "GET",
  }));
}

function detectLibraries(scripts: string[], html: string) {
  const haystack = `${scripts.join(" ")} ${html.slice(0, 25000)}`;
  const patterns = [
    ["jQuery", /jquery[-.]?(\d+\.\d+(?:\.\d+)?)/i],
    ["Bootstrap", /bootstrap[-.]?(\d+\.\d+(?:\.\d+)?)/i],
    ["Angular", /angular(?:\.min)?\.js|ng-version=["']([^"']+)["']/i],
    ["React", /react(?:\.production|\.development)?(?:\.min)?\.js|data-reactroot/i],
    ["Vue", /vue(?:\.runtime)?(?:\.min)?\.js|data-v-/i],
    ["Next.js", /_next\/static|next\/dist/i],
  ] as const;

  return patterns
    .filter(([, pattern]) => pattern.test(haystack))
    .map(([name, pattern]) => {
      const version = haystack.match(pattern)?.[1];
      return version ? `${name} ${version}` : name;
    });
}

function getCookieFindings(setCookie: string) {
  const cookies = setCookie
    ? setCookie.split(/,(?=\s*[^;,]+=)/).map((cookie) => cookie.trim())
    : [];

  return cookies.map((cookie) => ({
    name: cookie.split("=")[0],
    secure: /;\s*secure/i.test(cookie),
    httpOnly: /;\s*httponly/i.test(cookie),
    sameSite: /;\s*samesite=(strict|lax|none)/i.exec(cookie)?.[1] ?? "missing",
  }));
}

async function getTlsInfo(target: URL) {
  if (target.protocol !== "https:") return null;

  return new Promise<{
    protocol?: string | null;
    cipher?: string;
    issuer?: string;
    validTo?: string;
    cbcCipher: boolean;
  } | null>((resolve) => {
    const socket = tls.connect(
      {
        host: target.hostname,
        port: Number(target.port || 443),
        servername: target.hostname,
        timeout: 5000,
      },
      () => {
        const certificate = socket.getPeerCertificate();
        const cipher = socket.getCipher();
        const protocol = socket.getProtocol();
        socket.end();
        resolve({
          protocol,
          cipher: cipher?.name,
          issuer:
            certificate && typeof certificate === "object"
              ? normalizeCertificateValue(certificate.issuer?.O) ??
                normalizeCertificateValue(certificate.issuer?.CN)
              : undefined,
          validTo:
            certificate && typeof certificate === "object"
              ? certificate.valid_to
              : undefined,
          cbcCipher: /CBC/i.test(cipher?.name ?? ""),
        });
      }
    );

    socket.on("error", () => resolve(null));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(null);
    });
  });
}

function addFinding(findings: Finding[], finding: Finding) {
  findings.push(finding);
}

function normalizeCertificateValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return value;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const target = new URL(String(body.url ?? ""));
    await assertPublicTarget(target);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const startedAt = Date.now();

    const [response, tlsInfo] = await Promise.all([
      fetch(target, {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "user-agent": "Atomix Reviewer Copilot Passive Review/1.0",
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      }),
      getTlsInfo(target),
    ]);

    clearTimeout(timeout);

    const contentType = getHeader(response.headers, "content-type");
    const html = contentType.includes("text/html")
      ? await response.text()
      : "";
    const finalUrl = response.url || target.toString();
    const finalTarget = new URL(finalUrl);
    const findings: Finding[] = [];

    const hsts = getHeader(response.headers, "strict-transport-security");
    const csp = getHeader(response.headers, "content-security-policy");
    const xFrame = getHeader(response.headers, "x-frame-options");
    const xContentType = getHeader(response.headers, "x-content-type-options");
    const referrer = getHeader(response.headers, "referrer-policy");
    const permissions = getHeader(response.headers, "permissions-policy");
    const cache = getHeader(response.headers, "cache-control");
    const acao = getHeader(response.headers, "access-control-allow-origin");
    const server = getHeader(response.headers, "server");
    const poweredBy = getHeader(response.headers, "x-powered-by");
    const setCookie = getHeader(response.headers, "set-cookie");
    const cookies = getCookieFindings(setCookie);
    const scripts = collectScripts(html);
    const comments = collectComments(html);
    const forms = collectForms(html);
    const libraries = detectLibraries(scripts, html);
    const params = Array.from(finalTarget.searchParams.keys()).filter((param) =>
      riskyParameterNames.includes(param.toLowerCase())
    );
    const jwtHints = Array.from(
      html.matchAll(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g)
    ).length;

    if (finalTarget.protocol === "https:" && tlsInfo) {
      addFinding(findings, {
        check: "HTTPS and TLS posture",
        severity: tlsInfo.cbcCipher ? "medium" : "pass",
        status: tlsInfo.cbcCipher ? "review" : "pass",
        evidence: `${tlsInfo.protocol ?? "TLS"} using ${
          tlsInfo.cipher ?? "unknown cipher"
        }; issuer ${tlsInfo.issuer ?? "unknown"}; valid to ${
          tlsInfo.validTo ?? "unknown"
        }.`,
        recommendation: tlsInfo.cbcCipher
          ? "Disable CBC cipher suites and prefer TLS 1.2/1.3 AEAD ciphers."
          : "Continue monitoring certificate expiry and approved cipher policy.",
        control: "10.2, 11.1-11.10",
        pointsLost: tlsInfo.cbcCipher ? 6 : 0,
      });
    } else {
      addFinding(findings, {
        check: "HTTPS and TLS posture",
        severity: "high",
        status: "fail",
        evidence: "Target did not resolve to an HTTPS endpoint with inspectable TLS.",
        recommendation: "Use HTTPS with a valid trusted certificate for all review targets.",
        control: "10.2, 11.1-11.10",
        pointsLost: 14,
      });
    }

    addFinding(findings, {
      check: "HTTP Strict Transport Security",
      severity:
        hsts && /includesubdomains/i.test(hsts) && /max-age=3\d{7,}/i.test(hsts)
          ? "pass"
          : "medium",
      status:
        hsts && /includesubdomains/i.test(hsts) && /max-age=3\d{7,}/i.test(hsts)
          ? "pass"
          : "review",
      evidence: hsts || "HSTS header missing.",
      recommendation:
        "For internet-facing HTTPS apps, use max-age of at least one year with includeSubDomains after coverage validation.",
      control: "11.6, 16.14",
      pointsLost:
        hsts && /includesubdomains/i.test(hsts) && /max-age=3\d{7,}/i.test(hsts)
          ? 0
          : 8,
    });

    addFinding(findings, {
      check: "Content Security Policy",
      severity: csp ? "pass" : "high",
      status: csp ? "pass" : "fail",
      evidence: csp || "Content-Security-Policy header is missing.",
      recommendation:
        "Define CSP with script-src, object-src, frame-ancestors, connect-src, and report-only rollout before enforcement.",
      control: "9.3, 16.14",
      pointsLost: csp ? 0 : 12,
    });

    addFinding(findings, {
      check: "Clickjacking protection",
      severity: xFrame || /frame-ancestors/i.test(csp) ? "pass" : "medium",
      status: xFrame || /frame-ancestors/i.test(csp) ? "pass" : "review",
      evidence: xFrame || (csp ? "CSP present; verify frame-ancestors." : "No X-Frame-Options or frame-ancestors detected."),
      recommendation:
        "Use CSP frame-ancestors or X-Frame-Options to prevent unauthorized framing.",
      control: "9.5, 16.14",
      pointsLost: xFrame || /frame-ancestors/i.test(csp) ? 0 : 6,
    });

    addFinding(findings, {
      check: "Browser hardening headers",
      severity: xContentType && referrer && permissions ? "pass" : "medium",
      status: xContentType && referrer && permissions ? "pass" : "review",
      evidence: `X-Content-Type-Options: ${
        xContentType || "missing"
      }; Referrer-Policy: ${referrer || "missing"}; Permissions-Policy: ${
        permissions || "missing"
      }.`,
      recommendation:
        "Set nosniff, a restrictive referrer policy, and a least-privilege permissions policy.",
      control: "16.14",
      pointsLost: xContentType && referrer && permissions ? 0 : 6,
    });

    addFinding(findings, {
      check: "Cache control for sensitive pages",
      severity: /no-store/i.test(cache) ? "pass" : "medium",
      status: /no-store/i.test(cache) ? "pass" : "review",
      evidence: cache || "Cache-Control header missing.",
      recommendation:
        "Use Cache-Control: no-cache, no-store, max-age=0 for authenticated or sensitive views.",
      control: "12.5-12.7, 16.14",
      pointsLost: /no-store/i.test(cache) ? 0 : 5,
    });

    addFinding(findings, {
      check: "CORS exposure",
      severity: acao === "*" ? "high" : acao ? "medium" : "pass",
      status: acao === "*" ? "fail" : acao ? "review" : "pass",
      evidence: acao ? `Access-Control-Allow-Origin: ${acao}` : "No broad ACAO header observed.",
      recommendation:
        "Avoid wildcard CORS on authenticated APIs; allow only trusted origins and avoid credentialed wildcard patterns.",
      control: "7.1-7.2, 19.4",
      pointsLost: acao === "*" ? 10 : acao ? 4 : 0,
    });

    if (server || poweredBy || libraries.length) {
      addFinding(findings, {
        check: "Version and technology disclosure",
        severity: "medium",
        status: "review",
        evidence: [
          server ? `Server: ${server}` : "",
          poweredBy ? `X-Powered-By: ${poweredBy}` : "",
          libraries.length ? `Client libraries: ${libraries.join(", ")}` : "",
        ]
          .filter(Boolean)
          .join("; "),
        recommendation:
          "Minimize server and framework version disclosure; track disclosed libraries against dependency advisories.",
        control: "14.7, 16.4",
        pointsLost: 5,
      });
    }

    const weakCookies = cookies.filter(
      (cookie) => !cookie.secure || !cookie.httpOnly || cookie.sameSite === "missing"
    );
    if (cookies.length) {
      addFinding(findings, {
        check: "Cookie security flags",
        severity: weakCookies.length ? "medium" : "pass",
        status: weakCookies.length ? "review" : "pass",
        evidence: weakCookies.length
          ? `${weakCookies.length}/${cookies.length} cookies missing Secure, HttpOnly, or SameSite.`
          : `${cookies.length} cookies include expected security flags.`,
        recommendation:
          "Session cookies should use Secure, HttpOnly, explicit SameSite, scoped domain/path, and short expiry where applicable.",
        control: "8.4, 8.7-8.15",
        pointsLost: weakCookies.length ? 7 : 0,
      });
    }

    if (forms.length) {
      const missingCsrf = forms.filter((form) => !form.hasCsrf).length;
      const passwordGet = forms.some((form) => form.hasPassword && form.method !== "POST");
      addFinding(findings, {
        check: "Forms, CSRF, and password handling",
        severity: missingCsrf || passwordGet ? "high" : "pass",
        status: missingCsrf || passwordGet ? "review" : "pass",
        evidence: `${forms.length} forms observed; ${missingCsrf} without visible CSRF token; password-over-non-POST observed: ${
          passwordGet ? "yes" : "no"
        }.`,
        recommendation:
          "Verify server-side CSRF protection, POST over TLS for credentials, autocomplete controls for sensitive fields, and server-side input validation.",
        control: "6.6, 8.9, 9.1",
        pointsLost: missingCsrf || passwordGet ? 9 : 0,
      });
    }

    if (params.length) {
      addFinding(findings, {
        check: "SSRF and redirect parameter indicators",
        severity: "medium",
        status: "review",
        evidence: `URL-like parameters detected: ${params.join(", ")}.`,
        recommendation:
          "Manually verify allowlists, internal address blocking, redirect validation, webhook validation, and server-side URL fetch controls.",
        control: "9.7, 9.10",
        pointsLost: 5,
      });
    }

    if (comments.length || jwtHints) {
      addFinding(findings, {
        check: "Client-side leakage indicators",
        severity: jwtHints ? "high" : "medium",
        status: "review",
        evidence: `${comments.length} HTML comments observed; JWT-like token hints observed: ${jwtHints}.`,
        recommendation:
          "Remove sensitive comments, avoid embedding tokens in client-rendered HTML, and validate JWT claims/algorithms server-side.",
        control: "14.6, 19.1-19.6",
        pointsLost: jwtHints ? 10 : 4,
      });
    }

    const pointsLost = findings.reduce((sum, finding) => sum + finding.pointsLost, 0);
    const score = Math.max(0, Math.min(100, 100 - pointsLost));
    const finalGrade = grade(score);

    return Response.json({
      target: target.toString(),
      finalUrl,
      scannedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      score,
      grade: finalGrade,
      posture:
        score >= 80
          ? "Good preliminary posture"
          : score >= 60
            ? "Moderate preliminary posture"
            : "Weak preliminary posture",
      summary:
        "Passive reviewer copilot scan completed. Use this as a pre-review signal, not a replacement for authenticated testing, business-logic review, or manual validation.",
      findings,
      quickReviewActions: [
        "Confirm auth model, RBAC roles, test accounts, target URL/IP, and in-scope environments.",
        "Run manual checks for authorization, CSRF, input validation, SSRF, file upload, and session handling.",
        "Map observed issues to FEAD/BEAD controls and collect screenshots or scan evidence.",
        "Use the LLM prompt library only in authorized LLM-enabled application reviews.",
      ],
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to complete passive review.",
      },
      { status: 400 }
    );
  }
}
