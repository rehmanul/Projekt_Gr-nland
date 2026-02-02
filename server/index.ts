import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { initStorage } from "./storage";
import { serveStatic } from "./static";
import { createServer, Server } from "http";

const app = express();

// Only create http server for non-Vercel environments
let httpServer: Server | null = null;
if (!process.env.VERCEL) {
  httpServer = createServer(app);
}

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

/** Build and return the Express app (for Vercel serverless or programmatic use). */
export async function createApp(): Promise<express.Express> {
  try {
    const storage = await initStorage();
    // Pass a dummy server on Vercel since we don't use it
    const dummyServer = httpServer || createServer(app);
    await registerRoutes(dummyServer, app, storage);

    app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error("Internal Server Error:", err);

      if (res.headersSent) {
        return next(err);
      }

      return res.status(status).json({ message });
    });

    if (process.env.VERCEL) {
      // Static assets and SPA fallback are served by Vercel via outputDirectory
    } else if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(dummyServer, app);
    }

    return app;
  } catch (error) {
    console.error("createApp failed:", error);
    throw error;
  }
}

// When not on Vercel, run the server; on Vercel the api handler uses createApp()
if (!process.env.VERCEL) {
  (async () => {
    await createApp();
    const port = parseInt(process.env.PORT || "5000", 10);
    const host = process.env.HOST || "127.0.0.1";
    httpServer!.listen(
      {
        port,
        host,
      },
      () => {
        log(`serving on http://${host}:${port}`);
      },
    );
  })();
}
