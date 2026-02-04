let appPromise = null;

export default async function handler(req, res) {
  try {
    if (!appPromise) {
      const appModule = await import(new URL("../dist/index.cjs", import.meta.url));
      const createApp = appModule.createApp || appModule.default?.createApp;
      if (typeof createApp !== "function") {
        throw new Error("createApp export not found");
      }
      appPromise = createApp();
    }
    const app = await appPromise;
    return app(req, res);
  } catch (error) {
    console.error("Vercel handler error:", error);
    return res.status(500).json({
      error: error?.message || "Unknown serverless init error",
      type: "SERVERLESS_INIT_ERROR",
    });
  }
}
