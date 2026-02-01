/**
 * Vercel Serverless Entry Point
 * This file is the entry point for esbuild to create a fully-bundled serverless function.
 * It wraps the Express app's createApp() function for Vercel's serverless environment.
 */
import { createApp } from "./index";
import type { Request, Response } from "express";

let appPromise: Promise<any> | null = null;

// Vercel expects module.exports for the handler
module.exports = async function handler(req: Request, res: Response) {
    try {
        if (!appPromise) {
            appPromise = createApp();
        }
        const app = await appPromise;
        return app(req, res);
    } catch (error: any) {
        console.error("Vercel handler error:", error);
        return res.status(500).json({
            error: error.message,
            type: "SERVERLESS_INIT_ERROR"
        });
    }
};
