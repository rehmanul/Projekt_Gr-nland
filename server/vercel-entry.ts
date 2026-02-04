/**
 * Vercel Serverless Entry Point
 * This file is the entry point for esbuild to create a fully-bundled serverless function.
 * It wraps the Express app's createApp() function for Vercel's serverless environment.
 */
import type { Request, Response } from "express";

let appPromise: Promise<any> | null = null;

// ESM default export for Vercel handler
export default async function handler(req: Request, res: Response) {
  try {
    if (!appPromise) {
      const { createApp } = await import("./index");
      appPromise = createApp();
    }
    const app = await appPromise;
    return app(req, res);
  } catch (error: any) {
    console.error("Vercel handler error:", error);
    return res.status(500).json({
      error: error?.message ?? "Unknown serverless init error",
      type: "SERVERLESS_INIT_ERROR",
    });
  }
}
