// Production web server for the FindMyhome frontend (used on Railway).
// No extra packages: only Node's built-in modules.
//
// - Serves the built React app from dist/ (run `npm run build` first)
// - Sends index.html for app routes like /applications, so a refresh works
// - Forwards every /api request to the backend (BACKEND_URL). The browser only
//   ever talks to this one site, so the httpOnly login cookie works without any
//   cross-site cookie or CORS settings.
//
// Start it with:  BACKEND_URL=https://your-backend.example.com npm start

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT) || 3000;
const DIST = resolve(fileURLToPath(new URL(".", import.meta.url)), "dist");
const BACKEND_URL = process.env.BACKEND_URL;

if (!BACKEND_URL) {
  console.error("BACKEND_URL is missing, e.g. BACKEND_URL=https://your-backend.example.com");
  process.exit(1);
}

const backend = new URL(BACKEND_URL);
const sendToBackend = backend.protocol === "https:" ? httpsRequest : httpRequest;

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

// Basic protection headers on every page and file
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

// Hop-by-hop headers that must not be passed through a proxy
const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
]);

function proxyToBackend(req, res) {
  const headers = {};
  for (const [name, value] of Object.entries(req.headers)) {
    if (!HOP_BY_HOP.has(name.toLowerCase())) headers[name] = value;
  }
  headers.host = backend.host;
  headers["x-forwarded-host"] = req.headers.host ?? "";
  headers["x-forwarded-proto"] = req.headers["x-forwarded-proto"] ?? "https";

  const outgoing = sendToBackend(
    {
      protocol: backend.protocol,
      hostname: backend.hostname,
      port: backend.port || undefined,
      method: req.method,
      path: req.url,
      headers,
      timeout: 30000,
    },
    (incoming) => {
      const responseHeaders = {};
      for (const [name, value] of Object.entries(incoming.headers)) {
        if (!HOP_BY_HOP.has(name.toLowerCase())) responseHeaders[name] = value;
      }
      res.writeHead(incoming.statusCode ?? 502, { ...SECURITY_HEADERS, ...responseHeaders });
      incoming.pipe(res);
    }
  );

  outgoing.on("timeout", () => outgoing.destroy(new Error("Backend timed out")));
  outgoing.on("error", (error) => {
    console.error("API proxy error:", error.message);
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "application/json", ...SECURITY_HEADERS });
    }
    res.end(JSON.stringify({ message: "We can't reach the server right now. Please try again." }));
  });

  req.pipe(outgoing);
}

async function serveFile(res, filePath, cacheControl) {
  res.writeHead(200, {
    "Content-Type": CONTENT_TYPES[extname(filePath).toLowerCase()] ?? "application/octet-stream",
    "Cache-Control": cacheControl,
    ...SECURITY_HEADERS,
  });
  createReadStream(filePath).pipe(res);
}

async function serveApp(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD", ...SECURITY_HEADERS });
    res.end();
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    res.writeHead(400, SECURITY_HEADERS);
    res.end("Bad request");
    return;
  }

  // Only files inside dist/ can be served
  const filePath = resolve(join(DIST, pathname));
  if (filePath.startsWith(DIST + sep)) {
    try {
      const info = await stat(filePath);
      if (info.isFile()) {
        // Vite gives built files a content hash in /assets/, so they can be cached for a year
        const cache = pathname.startsWith("/assets/")
          ? "public, max-age=31536000, immutable"
          : "public, max-age=3600";
        await serveFile(res, filePath, cache);
        return;
      }
    } catch {
      // Not a file: fall through to the app
    }
  }

  // A file that does not exist (e.g. /logo.png) gets a 404; app routes get index.html
  if (extname(pathname)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", ...SECURITY_HEADERS });
    res.end("Not found");
    return;
  }

  await serveFile(res, join(DIST, "index.html"), "no-cache");
}

const server = createServer((req, res) => {
  if (req.url === "/api" || req.url.startsWith("/api/")) {
    proxyToBackend(req, res);
    return;
  }

  serveApp(req, res).catch((error) => {
    console.error("Server error:", error);
    if (!res.headersSent) res.writeHead(500, SECURITY_HEADERS);
    res.end();
  });
});

server.listen(PORT, () => {
  console.log(`FindMyhome frontend on port ${PORT}, forwarding /api to ${backend.origin}`);
});
